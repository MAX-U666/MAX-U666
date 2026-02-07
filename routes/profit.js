/**
 * SKU利润计算路由
 * 回款按包裹内SKU售价比例分摊
 */

const express = require('express');

module.exports = function(pool) {
  const router = express.Router();

  function getDateRange(range, startDate, endDate) {
    // 支持自定义日期: startDate=2026-01-01&endDate=2026-02-06
    if (startDate && endDate) {
      return { start: startDate, end: endDate };
    }

    const now = new Date();
    const today = new Date(now.getTime() + 7 * 3600000);
    const todayStr = today.toISOString().split('T')[0];
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    switch (range) {
      case 'today':
        return { start: todayStr, end: todayStr };
      case 'yesterday':
        return { start: yesterdayStr, end: yesterdayStr };
      case '7d': {
        const d = new Date(today);
        d.setDate(d.getDate() - 6);
        return { start: d.toISOString().split('T')[0], end: todayStr };
      }
      case '30d': {
        const d = new Date(today);
        d.setDate(d.getDate() - 29);
        return { start: d.toISOString().split('T')[0], end: todayStr };
      }
      default:
        return { start: todayStr, end: todayStr };
    }
  }

  function getPackingCost(warehouseName, exchangeRate) {
    return 2.8; // 统一仓储费
  }

  router.get('/sku-list', async (req, res) => {
    try {
      const { range = 'today', shop, keyword, startDate, endDate } = req.query;
      const { start, end } = getDateRange(range, startDate, endDate);

      let orderWhere = `WHERE DATE(o.gmt_order_start) >= ? AND DATE(o.gmt_order_start) <= ?`;
      let orderParams = [start, end];
      orderWhere += ` AND o.app_package_status NOT IN ('cancelled', 'returned', 'unpaid', 'refunding')`;
      
      if (shop) {
        orderWhere += ` AND o.shop_name = ?`;
        orderParams.push(shop);
      }

      const [orderItems] = await pool.query(`
        SELECT 
          oi.goods_sku_outer_id as sku_id,
          oi.goods_name as sku_name,
          oi.goods_mode,
          oi.warehouse_name,
          oi.platform_item_id,
          oi.quantity,
          oi.discounted_price,
          oi.op_order_package_id,
          o.escrow_amount,
          o.exchange_rate,
          o.shop_name,
          o.currency
        FROM eb_order_items oi
        JOIN eb_orders o ON oi.op_order_package_id = o.op_order_package_id
        ${orderWhere}
      `, orderParams);

      if (orderItems.length === 0) {
        return res.json({ success: true, data: [], overview: getEmptyOverview(), shops: [] });
      }

      // 计算每个包裹的SKU售价总和（用于分摊回款）
      const packageTotals = {};
      for (const item of orderItems) {
        const pkgId = item.op_order_package_id;
        if (!packageTotals[pkgId]) packageTotals[pkgId] = 0;
        packageTotals[pkgId] += parseFloat(item.discounted_price) || 0;
      }

      // 获取SKU成本
      const allSkus = [...new Set(orderItems.map(i => i.sku_id).filter(Boolean))];
      if (allSkus.length === 0) {
        return res.json({ success: true, data: [], overview: getEmptyOverview(), shops: [] });
      }
      const ph = allSkus.map(() => '?').join(',');
      
      const [singleCosts] = await pool.query(
        `SELECT sku, purchase_price FROM eb_sku_costs WHERE sku IN (${ph})`, allSkus
      );
      const singleCostMap = {};
      singleCosts.forEach(r => { singleCostMap[r.sku] = parseFloat(r.purchase_price) || 0; });

      const [comboCosts] = await pool.query(
        `SELECT c.combo_sku, c.item_sku, c.quantity, s.purchase_price
         FROM eb_sku_combos c
         LEFT JOIN eb_sku_costs s ON c.item_sku = s.sku
         WHERE c.combo_sku IN (${ph})`, allSkus
      );
      const comboCostMap = {};
      comboCosts.forEach(r => {
        if (!comboCostMap[r.combo_sku]) comboCostMap[r.combo_sku] = 0;
        comboCostMap[r.combo_sku] += (parseFloat(r.purchase_price) || 0) * (r.quantity || 1);
      });

      // 广告数据
      const [adData] = await pool.query(`
        SELECT platform_item_id, SUM(expense_cny) as total_ad_cny
        FROM eb_ad_daily
        WHERE date >= ? AND date <= ? AND platform_item_id IS NOT NULL
        GROUP BY platform_item_id
      `, [start, end]);
      const adMap = {};
      adData.forEach(r => { adMap[r.platform_item_id] = (parseFloat(r.total_ad_cny) || 0) * 1.11; }); // 含11%增值税

      // 聚合SKU利润
      const skuMap = {};
      
      for (const item of orderItems) {
        const skuId = item.sku_id;
        if (!skuId) continue;
        const mapKey = skuId + '||' + (item.shop_name || '');
        
        if (!skuMap[mapKey]) {
          skuMap[mapKey] = {
            sku: skuId, name: item.sku_name || '', store: item.shop_name || '',
            orders: 0, qty: 0, revenue: 0, cost: 0, packing: 0, ad: 0,
            profit: 0, roi: 0, rate: 0, warehouse: 0, itemIds: new Set(), pkgIds: new Set()
          };
        }

        const s = skuMap[mapKey];
        s.qty += item.quantity || 1;
        s.pkgIds.add(item.op_order_package_id);
        
        // 回款按售价比例分摊
        const xrate = parseFloat(item.exchange_rate) || 2450;
        const escrow = parseFloat(item.escrow_amount) || 0;
        const myPrice = parseFloat(item.discounted_price) || 0;
        const pkgTotal = packageTotals[item.op_order_package_id] || myPrice || 1;
        const ratio = pkgTotal > 0 ? myPrice / pkgTotal : 1;
        const myEscrowCNY = (escrow * ratio) / xrate;
        s.revenue += myEscrowCNY;

        // 商品成本
        let unitCost = 0;
        if (item.goods_mode === 'bundle' && comboCostMap[skuId] !== undefined) {
          unitCost = comboCostMap[skuId];
        } else if (singleCostMap[skuId] !== undefined) {
          unitCost = singleCostMap[skuId];
        }
        s.cost += unitCost * (item.quantity || 1);

        // 包材费
        s.packing += getPackingCost(item.warehouse_name, xrate);

        if (item.platform_item_id) {
          s.itemIds.add(String(item.platform_item_id));
        }
      }

      // 把包裹去重数转为订单数
      for (const sku of Object.values(skuMap)) {
        sku.orders = sku.pkgIds.size;
        delete sku.pkgIds;
      }

      // 统计每个platform_item_id下各SKU+店铺的订单量（用于按订单量占比分摊广告费）
      const itemIdSkuOrders = {}; // { itemId: { mapKey: orders, ... } }
      for (const [mapKey, sku] of Object.entries(skuMap)) {
        for (const itemId of sku.itemIds) {
          if (!itemIdSkuOrders[itemId]) itemIdSkuOrders[itemId] = {};
          itemIdSkuOrders[itemId][mapKey] = (itemIdSkuOrders[itemId][mapKey] || 0) + sku.orders;
        }
      }

      // 广告费按订单量占比分摊 + 利润
      for (const [mapKey, sku] of Object.entries(skuMap)) {
        for (const itemId of sku.itemIds) {
          if (adMap[itemId] && itemIdSkuOrders[itemId]) {
            const totalOrders = Object.values(itemIdSkuOrders[itemId]).reduce((a, b) => a + b, 0);
            const myOrders = itemIdSkuOrders[itemId][mapKey] || 0;
            const ratio = totalOrders > 0 ? myOrders / totalOrders : 0;
            sku.ad += adMap[itemId] * ratio;
          }
        }
        delete sku.itemIds;
        sku.profit = sku.revenue - sku.cost - sku.packing - sku.ad;
        sku.roi = sku.ad > 0 ? sku.revenue / sku.ad : (sku.revenue > 0 ? 999 : 0);
        sku.rate = sku.revenue > 0 ? (sku.profit / sku.revenue) * 100 : 0;
      }

      let result = Object.values(skuMap);
      if (keyword) {
        const kw = keyword.toLowerCase();
        result = result.filter(s => s.sku.toLowerCase().includes(kw) || s.name.toLowerCase().includes(kw));
      }
      result.sort((a, b) => b.profit - a.profit);

      // 概览：出单量=包裹去重数，件数=quantity总和
      const allPkgIds = new Set(orderItems.map(i => i.op_order_package_id));
      const overview = {
        totalSku: result.length,
        totalOrders: allPkgIds.size,
        totalQty: orderItems.reduce((s, i) => s + (i.quantity || 1), 0),
        profitSku: result.filter(s => s.profit > 0).length,
        lossSku: result.filter(s => s.profit <= 0).length,
        roiReached: result.filter(s => s.roi >= 4).length,
        totalProfit: result.reduce((s, d) => s + d.profit, 0),
        totalRevenue: result.reduce((s, d) => s + d.revenue, 0),
        totalCost: result.reduce((s, d) => s + d.cost, 0),
        totalAd: result.reduce((s, d) => s + d.ad, 0),
        totalPacking: result.reduce((s, d) => s + d.packing, 0),
      };
      const shops = [...new Set(orderItems.map(i => i.shop_name).filter(Boolean))];

      res.json({ success: true, data: result, overview, shops, dateRange: { start, end } });
    } catch (err) {
      console.error('[SKU利润] 查询失败:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/shop-ad', async (req, res) => {
    try {
      const { range = 'today' } = req.query;
      const { start, end } = getDateRange(range);
      const [rows] = await pool.query(`
        SELECT shop_id, SUM(expense_cny) as shop_ad_cny
        FROM eb_ad_daily
        WHERE date >= ? AND date <= ? AND platform_item_id IS NULL
        GROUP BY shop_id
      `, [start, end]);
      res.json({ success: true, data: rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 订单利润列表（按包裹粒度）
   * GET /api/profit/order-list?range=today&shop=&keyword=
   */
  router.get('/order-list', async (req, res) => {
    try {
      const { range = 'today', shop, keyword, startDate, endDate } = req.query;
      const { start, end } = getDateRange(range, startDate, endDate);

      let orderWhere = `WHERE DATE(o.gmt_order_start) >= ? AND DATE(o.gmt_order_start) <= ?`;
      let orderParams = [start, end];
      // 不过滤状态，展示所有订单
      if (shop) { orderWhere += ` AND o.shop_name = ?`; orderParams.push(shop); }

      // 获取订单+明细
      const [rows] = await pool.query(`
        SELECT 
          o.platform_order_sn as order_sn,
          o.op_order_package_id as pkg_id,
          o.shop_name, o.escrow_amount, o.exchange_rate,
          o.gmt_order_start as order_time,
          o.app_package_status_text as status, o.app_package_status as status_raw,
          o.buyer_username,
          oi.goods_sku_outer_id as sku_id,
          oi.goods_name as sku_name,
          oi.goods_mode,
          oi.warehouse_name,
          oi.platform_item_id,
          oi.quantity,
          oi.discounted_price
        FROM eb_order_items oi
        JOIN eb_orders o ON oi.op_order_package_id = o.op_order_package_id
        ${orderWhere}
        ORDER BY o.gmt_order_start DESC
      `, orderParams);

      if (rows.length === 0) {
        return res.json({ success: true, data: [], overview: getEmptyOrderOverview(), shops: [] });
      }

      // 包裹售价总和
      const packageTotals = {};
      for (const r of rows) {
        if (!packageTotals[r.pkg_id]) packageTotals[r.pkg_id] = 0;
        packageTotals[r.pkg_id] += parseFloat(r.discounted_price) || 0;
      }

      // SKU成本
      const allSkus = [...new Set(rows.map(r => r.sku_id).filter(Boolean))];
      const ph = allSkus.length > 0 ? allSkus.map(() => '?').join(',') : "''";
      
      const [singleCosts] = allSkus.length > 0 ? await pool.query(
        `SELECT sku, purchase_price FROM eb_sku_costs WHERE sku IN (${ph})`, allSkus
      ) : [[]];
      const singleCostMap = {};
      singleCosts.forEach(r => { singleCostMap[r.sku] = parseFloat(r.purchase_price) || 0; });

      const [comboCosts] = allSkus.length > 0 ? await pool.query(
        `SELECT c.combo_sku, c.item_sku, c.quantity, s.purchase_price
         FROM eb_sku_combos c LEFT JOIN eb_sku_costs s ON c.item_sku = s.sku
         WHERE c.combo_sku IN (${ph})`, allSkus
      ) : [[]];
      const comboCostMap = {};
      comboCosts.forEach(r => {
        if (!comboCostMap[r.combo_sku]) comboCostMap[r.combo_sku] = 0;
        comboCostMap[r.combo_sku] += (parseFloat(r.purchase_price) || 0) * (r.quantity || 1);
      });

      // 广告(按item_id, 统计SKU数用于均摊)
      const [adData] = await pool.query(`
        SELECT platform_item_id, SUM(expense_cny) as total_ad_cny
        FROM eb_ad_daily WHERE date >= ? AND date <= ? AND platform_item_id IS NOT NULL
        GROUP BY platform_item_id
      `, [start, end]);
      const adMap = {};
      adData.forEach(r => { adMap[r.platform_item_id] = (parseFloat(r.total_ad_cny) || 0) * 1.11; }); // 含11%增值税

      // 统计每个item_id下各SKU的订单量（用于按订单量占比分摊广告费）
      const itemIdSkuOrders = {}; // { itemId: { skuId: totalQty } }
      for (const r of rows) {
        const itemId = String(r.platform_item_id);
        if (r.platform_item_id) {
          if (!itemIdSkuOrders[itemId]) itemIdSkuOrders[itemId] = {};
          itemIdSkuOrders[itemId][r.sku_id] = (itemIdSkuOrders[itemId][r.sku_id] || 0) + (r.quantity || 1);
        }
      }

      // 按包裹聚合订单
      const orderMap = {};
      for (const r of rows) {
        const key = r.pkg_id;
        if (!orderMap[key]) {
          orderMap[key] = {
            id: r.order_sn,
            store: r.shop_name,
            date: r.order_time ? new Date(r.order_time).toISOString().split('T')[0] : '',
            status: r.status, statusRaw: r.status_raw,
            buyer: r.buyer_username,
            items: [],
            revenue: 0, cost: 0, packing: 0, ad: 0, profit: 0, qty: 0
          };
        }
        const ord = orderMap[key];
        const xrate = parseFloat(r.exchange_rate) || 2450;
        const escrow = parseFloat(r.escrow_amount) || 0;
        const myPrice = parseFloat(r.discounted_price) || 0;
        const pkgTotal = packageTotals[r.pkg_id] || myPrice || 1;
        const ratio = pkgTotal > 0 ? myPrice / pkgTotal : 1;
        const revenueCNY = (escrow * ratio) / xrate;

        let unitCost = 0;
        if (r.goods_mode === 'bundle' && comboCostMap[r.sku_id] !== undefined) {
          unitCost = comboCostMap[r.sku_id];
        } else if (singleCostMap[r.sku_id] !== undefined) {
          unitCost = singleCostMap[r.sku_id];
        }
        const itemCost = unitCost * (r.quantity || 1);
        const packCost = getPackingCost(r.warehouse_name, xrate);
        
        // 广告费(按SKU订单量占比分摊)
        let itemAd = 0;
        if (r.platform_item_id && adMap[String(r.platform_item_id)]) {
          const itemId = String(r.platform_item_id);
          const skuOrders = itemIdSkuOrders[itemId] || {};
          const totalOrders = Object.values(skuOrders).reduce((a, b) => a + b, 0);
          const myOrders = skuOrders[r.sku_id] || 0;
          const ratio = totalOrders > 0 ? myOrders / totalOrders : 0;
          itemAd = adMap[itemId] * ratio;
        }

        ord.items.push({
          sku: r.sku_id, name: r.sku_name || '', qty: r.quantity || 1,
          revenue: revenueCNY, cost: itemCost, packing: packCost, ad: itemAd,
          profit: revenueCNY - itemCost - packCost - itemAd
        });

        ord.revenue += revenueCNY;
        ord.cost += itemCost;
        ord.packing += packCost;
        ord.ad += itemAd;
        ord.qty += r.quantity || 1;
      }

      // 计算订单利润
      let result = Object.values(orderMap);
      result.forEach(o => { o.profit = o.revenue - o.cost - o.packing - o.ad; });

      // 搜索
      if (keyword) {
        const kw = keyword.toLowerCase();
        result = result.filter(o =>
          o.id.toLowerCase().includes(kw) ||
          o.items.some(i => i.sku.toLowerCase().includes(kw) || i.name.toLowerCase().includes(kw))
        );
      }

      // 概览(利润只统计已完成订单)
      const finished = result.filter(o => o.statusRaw === 'finished');
      const overview = {
        totalOrders: result.length,
        finishedOrders: finished.length,
        profitOrders: finished.filter(o => o.profit > 0).length,
        lossOrders: finished.filter(o => o.profit <= 0).length,
        avgProfit: finished.length > 0 ? finished.reduce((s, o) => s + o.profit, 0) / finished.length : 0,
        totalProfit: finished.reduce((s, o) => s + o.profit, 0),
        totalRevenue: finished.reduce((s, o) => s + o.revenue, 0),
        statusCounts: {
          finished: result.filter(o => o.statusRaw === 'finished').length,
          wait_receiver_confirm: result.filter(o => o.statusRaw === 'wait_receiver_confirm').length,
          wait_seller_send: result.filter(o => o.statusRaw === 'wait_seller_send').length,
          cancelled: result.filter(o => o.statusRaw === 'cancelled').length,
          returned: result.filter(o => o.statusRaw === 'returned').length,
          refunding: result.filter(o => o.statusRaw === 'refunding').length,
          unpaid: result.filter(o => o.statusRaw === 'unpaid').length,
        }
      };

      // 按店铺汇总
      const shopMap = {};
      result.forEach(o => {
        if (!shopMap[o.store]) {
          shopMap[o.store] = { store: o.store, orders: 0, lossOrders: 0, totalProfit: 0, totalRevenue: 0 };
        }
        shopMap[o.store].orders++;
        if (o.profit <= 0) shopMap[o.store].lossOrders++;
        shopMap[o.store].totalProfit += o.profit;
        shopMap[o.store].totalRevenue += o.revenue;
      });
      const shopStats = Object.values(shopMap).map(s => ({
        ...s,
        avgProfit: s.orders > 0 ? s.totalProfit / s.orders : 0,
        lossRate: s.orders > 0 ? (s.lossOrders / s.orders) * 100 : 0,
        avgPrice: s.orders > 0 ? s.totalRevenue / s.orders : 0,
      })).sort((a, b) => b.totalProfit - a.totalProfit);

      // 亏损TOP10 + 低利润TOP10
      const lossTop = [...result].filter(o => o.profit < 0).sort((a, b) => a.profit - b.profit).slice(0, 10);
      const lowProfitTop = [...result].filter(o => o.profit >= 0 && o.profit < 5).sort((a, b) => a.profit - b.profit).slice(0, 10);

      // 利润区间分布
      const ranges = [
        { label: '< ¥0（亏损）', min: -Infinity, max: 0 },
        { label: '¥0 - ¥2', min: 0, max: 2 },
        { label: '¥2 - ¥5', min: 2, max: 5 },
        { label: '¥5 - ¥10', min: 5, max: 10 },
        { label: '¥10 - ¥20', min: 10, max: 20 },
        { label: '¥20 - ¥50', min: 20, max: 50 },
        { label: '≥ ¥50', min: 50, max: Infinity },
      ];
      const distribution = ranges.map(r => ({
        ...r,
        count: result.filter(o => o.profit >= r.min && o.profit < r.max).length
      }));

      const shops = [...new Set(rows.map(r => r.shop_name).filter(Boolean))];

      res.json({
        success: true,
        data: result,
        overview,
        shopStats,
        lossTop,
        lowProfitTop,
        distribution,
        shops,
        dateRange: { start, end }
      });
    } catch (err) {
      console.error('[订单利润] 查询失败:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  
  /**
   * 订单明细下载（CSV完整字段）
   * GET /api/profit/order-download?startDate=&endDate=&shop=
   */
  router.get('/order-download', async (req, res) => {
    try {
      const { range = 'today', shop, startDate, endDate } = req.query;
      const { start, end } = getDateRange(range, startDate, endDate);

      let orderWhere = `WHERE DATE(o.gmt_order_start) >= ? AND DATE(o.gmt_order_start) <= ?`;
      let orderParams = [start, end];
      if (shop) { orderWhere += ` AND o.shop_name = ?`; orderParams.push(shop); }

      const [rows] = await pool.query(`
        SELECT 
          o.platform_order_sn as order_sn,
          o.op_order_package_id as pkg_id,
          o.shop_name, o.escrow_amount, o.exchange_rate, o.currency,
          o.gmt_order_start as order_time,
          o.app_package_status as status_raw,
          o.app_package_status_text as status_text,
          o.buyer_username,
          oi.goods_sku_outer_id as sku_id,
          oi.goods_name as sku_name,
          oi.goods_mode,
          oi.warehouse_name,
          oi.platform_item_id,
          oi.quantity,
          oi.discounted_price
        FROM eb_order_items oi
        JOIN eb_orders o ON oi.op_order_package_id = o.op_order_package_id
        ${orderWhere}
        ORDER BY o.gmt_order_start DESC
      `, orderParams);

      // 包裹售价总和
      const packageTotals = {};
      for (const r of rows) {
        if (!packageTotals[r.pkg_id]) packageTotals[r.pkg_id] = 0;
        packageTotals[r.pkg_id] += parseFloat(r.discounted_price) || 0;
      }

      // SKU成本
      const allSkus = [...new Set(rows.map(r => r.sku_id).filter(Boolean))];
      const ph = allSkus.length > 0 ? allSkus.map(() => '?').join(',') : "'__NONE__'";
      const [singleCosts] = allSkus.length > 0 ? await pool.query(
        `SELECT sku, purchase_price FROM eb_sku_costs WHERE sku IN (${ph})`, allSkus
      ) : [[]];
      const singleCostMap = {};
      singleCosts.forEach(r => { singleCostMap[r.sku] = parseFloat(r.purchase_price) || 0; });

      const [comboCosts] = allSkus.length > 0 ? await pool.query(
        `SELECT c.combo_sku, c.item_sku, c.quantity, s.purchase_price
         FROM eb_sku_combos c LEFT JOIN eb_sku_costs s ON c.item_sku = s.sku
         WHERE c.combo_sku IN (${ph})`, allSkus
      ) : [[]];
      const comboCostMap = {};
      comboCosts.forEach(r => {
        if (!comboCostMap[r.combo_sku]) comboCostMap[r.combo_sku] = 0;
        comboCostMap[r.combo_sku] += (parseFloat(r.purchase_price) || 0) * (r.quantity || 1);
      });

      // 广告
      const [adData] = await pool.query(`
        SELECT platform_item_id, SUM(expense_cny) as total_ad_cny
        FROM eb_ad_daily WHERE date >= ? AND date <= ? AND platform_item_id IS NOT NULL
        GROUP BY platform_item_id
      `, [start, end]);
      const adMap = {};
      adData.forEach(r => { adMap[r.platform_item_id] = (parseFloat(r.total_ad_cny) || 0) * 1.11; });

      // 统计每个item_id下各SKU的订单量
      const itemIdSkuOrders = {};
      for (const r of rows) {
        const itemId = String(r.platform_item_id);
        if (r.platform_item_id) {
          if (!itemIdSkuOrders[itemId]) itemIdSkuOrders[itemId] = {};
          itemIdSkuOrders[itemId][r.sku_id] = (itemIdSkuOrders[itemId][r.sku_id] || 0) + (r.quantity || 1);
        }
      }

      // 生成CSV
      const csvRows = [
        ['订单号','包裹ID','店铺','日期','状态','买家','SKU编码','商品名称','数量','售价(原币)',
         '回款(原币)','汇率','回款(CNY)','商品成本(CNY)','仓储费(CNY)','广告费(CNY)',
         '利润(CNY)','利润率','仓库','商品ID'].join(',')
      ];

      for (const r of rows) {
        const xrate = parseFloat(r.exchange_rate) || 2450;
        const escrow = parseFloat(r.escrow_amount) || 0;
        const myPrice = parseFloat(r.discounted_price) || 0;
        const pkgTotal = packageTotals[r.pkg_id] || myPrice || 1;
        const ratio = pkgTotal > 0 ? myPrice / pkgTotal : 1;
        const revenueCNY = (escrow * ratio) / xrate;

        let unitCost = 0;
        if (r.goods_mode === 'bundle' && comboCostMap[r.sku_id] !== undefined) {
          unitCost = comboCostMap[r.sku_id];
        } else if (singleCostMap[r.sku_id] !== undefined) {
          unitCost = singleCostMap[r.sku_id];
        }
        const itemCost = unitCost * (r.quantity || 1);
        const packCost = 2.8;

        let itemAd = 0;
        if (r.platform_item_id && adMap[String(r.platform_item_id)]) {
          const itemId = String(r.platform_item_id);
          const skuOrders = itemIdSkuOrders[itemId] || {};
          const totalOrders = Object.values(skuOrders).reduce((a, b) => a + b, 0);
          const myOrders = skuOrders[r.sku_id] || 0;
          const adRatio = totalOrders > 0 ? myOrders / totalOrders : 0;
          itemAd = adMap[itemId] * adRatio;
        }

        const profit = revenueCNY - itemCost - packCost - itemAd;
        const profitRate = revenueCNY > 0 ? (profit / revenueCNY * 100).toFixed(1) + '%' : '0%';
        const orderDate = r.order_time ? new Date(r.order_time).toISOString().replace('T',' ').substr(0,19) : '';

        const fields = [
          r.order_sn, r.pkg_id, r.shop_name, orderDate, r.status_text || r.status_raw,
          r.buyer_username || '', r.sku_id, `"${(r.sku_name||'').replace(/"/g,'""')}"`,
          r.quantity || 1, myPrice, escrow, xrate, revenueCNY.toFixed(2),
          itemCost.toFixed(2), packCost.toFixed(2), itemAd.toFixed(2),
          profit.toFixed(2), profitRate, r.warehouse_name || '', r.platform_item_id || ''
        ];
        csvRows.push(fields.join(','));
      }

      const csv = '\uFEFF' + csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=orders_${start}_${end}.csv`);
      res.send(csv);
    } catch (err) {
      console.error('[订单下载] 失败:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  function getEmptyOrderOverview() {
    return { totalOrders: 0, profitOrders: 0, lossOrders: 0, avgProfit: 0, totalProfit: 0, totalRevenue: 0 };
  }

  function getEmptyOverview() {
    return { totalSku: 0, profitSku: 0, lossSku: 0, roiReached: 0,
      totalProfit: 0, totalRevenue: 0, totalCost: 0, totalAd: 0, totalPacking: 0 };
  }

  return router;
};
