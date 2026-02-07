/**
 * SKU利润计算路由
 * 回款按包裹内SKU售价比例分摊
 */

const express = require('express');

module.exports = function(pool, tokens) {
  const router = express.Router();

  // ==================== 权限中间件 ====================
  // 从 token 获取用户信息，查 user_shops 获取授权店铺
  router.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: '未登录' });
    }
    const token = authHeader.split(' ')[1];
    const user = tokens ? tokens.get(token) : null;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Token无效' });
    }
    req.user = user;

    // admin 看所有
    if (user.role === 'admin') {
      req.allowedShops = null; // null = 不过滤
      return next();
    }

    // operator: 查 user_shops + eb_shops 获取授权的 shop_name 列表
    try {
      const [rows] = await pool.query(
        `SELECT s.shop_name FROM user_shops us
         JOIN eb_shops s ON us.shop_id = s.shop_id
         WHERE us.user_id = ?`, [user.id]
      );
      req.allowedShops = rows.map(r => r.shop_name);
      if (req.allowedShops.length === 0) {
        req.allowedShops = ['__NO_ACCESS__']; // 无授权店铺，返回空数据
      }
    } catch (e) {
      console.error('[权限] 查询授权店铺失败:', e.message);
      req.allowedShops = ['__NO_ACCESS__'];
    }
    next();
  });

  // 辅助函数：给SQL加店铺过滤
  function applyShopFilter(whereClause, params, req, shopColumn = 'o.shop_name') {
    if (req.allowedShops && req.allowedShops.length > 0) {
      const ph = req.allowedShops.map(() => '?').join(',');
      whereClause += ` AND ${shopColumn} IN (${ph})`;
      params.push(...req.allowedShops);
    }
    return { whereClause, params };
  }
  const FIXED_RATE = 0.000434; // 统一汇率 1 IDR = ¥0.000434

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
    return 3.2; // 统一仓储费
  }

  function shortWarehouse(name) {
    if (!name) return '-';
    const n = name.toLowerCase();
    if (n.includes('momo')) return 'MOMO仓库';
    if (n.includes('bbt')) return 'BBT仓库';
    if (n.includes('jnt') || n.includes('j&t')) return 'J&T仓库';
    if (n.includes('flash')) return 'Flash仓库';
    if (n.includes('ninja')) return 'Ninja仓库';
    if (n.includes('sicepat')) return 'SiCepat仓库';
    if (n.includes('anteraja')) return 'AnterAja仓库';
    return name.length > 12 ? name.substring(0, 12) + '...' : name;
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
      // 权限过滤
      ({ whereClause: orderWhere, params: orderParams } = applyShopFilter(orderWhere, orderParams, req));

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
          o.currency,
          o.platform_order_sn
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
        SELECT platform_item_id, SUM(expense) as total_ad_idr, SUM(expense_cny) as total_ad_cny
        FROM eb_ad_daily
        WHERE date >= ? AND date <= ? AND platform_item_id IS NOT NULL
        GROUP BY platform_item_id
      `, [start, end]);
      const adMap = {};
      adData.forEach(r => { adMap[r.platform_item_id] = (parseFloat(r.total_ad_idr) || 0) * FIXED_RATE * 1.1; }); // IDR * 统一汇率 * 10%税

      // 聚合SKU利润
      const skuMap = {};
      
      // 全局按订单编号去重（一个订单只算一次打包费，不管几个SKU）
      const globalPackedOrderSns = new Set();

      for (const item of orderItems) {
        const skuId = item.sku_id;
        if (!skuId) continue;
        const mapKey = skuId + '||' + (item.shop_name || '');
        
        if (!skuMap[mapKey]) {
          skuMap[mapKey] = {
            sku: skuId, name: item.sku_name || '', store: item.shop_name || '',
            orders: 0, qty: 0, revenue: 0, cost: 0, packing: 0, ad: 0,
            profit: 0, roi: 0, rate: 0, warehouse: 0, itemIds: new Set(), orderSns: new Set(),
            warehouseName: ''
          };

        }

        const s = skuMap[mapKey];
        s.qty += item.quantity || 1;
        s.orderSns.add(item.platform_order_sn);
        
        // 回款按售价比例分摊（自带汇率）
        const xrate = parseFloat(item.exchange_rate) || 2450;
        const escrow = parseFloat(item.escrow_amount) || 0;
        const myPrice = parseFloat(item.discounted_price) || 0;
        const pkgTotal = packageTotals[item.op_order_package_id] || myPrice || 1;
        const ratio = pkgTotal > 0 ? myPrice / pkgTotal : 1;
        const myEscrowCNY = escrow * ratio / xrate;
        s.revenue += myEscrowCNY;
        if (!s.warehouseName && item.warehouse_name) s.warehouseName = shortWarehouse(item.warehouse_name);

        // 商品成本
        let unitCost = 0;
        if (item.goods_mode === 'bundle' && comboCostMap[skuId] !== undefined) {
          unitCost = comboCostMap[skuId];
        } else if (singleCostMap[skuId] !== undefined) {
          unitCost = singleCostMap[skuId];
        }
        s.cost += unitCost * (item.quantity || 1);

        // 打包费（全局按订单编号去重，一个订单只算一次，分摊给第一个遇到的SKU）
        if (!globalPackedOrderSns.has(item.platform_order_sn)) {
          s.packing += getPackingCost(item.warehouse_name);
          globalPackedOrderSns.add(item.platform_order_sn);
        }

        if (item.platform_item_id) {
          s.itemIds.add(String(item.platform_item_id));
        }
      }

      // 把订单编号去重数转为订单数
      for (const sku of Object.values(skuMap)) {
        sku.orders = sku.orderSns.size;
        delete sku.orderSns;
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

      // 概览：出单量=订单编号去重数，件数=quantity总和
      const allOrderSns = new Set(orderItems.map(i => i.platform_order_sn));
      const overview = {
        totalSku: result.length,
        totalOrders: allOrderSns.size,
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
      // 权限过滤
      ({ whereClause: orderWhere, params: orderParams } = applyShopFilter(orderWhere, orderParams, req));

      // 获取订单+明细
      const [rows] = await pool.query(`
        SELECT 
          o.platform_order_sn as order_sn,
          o.op_order_package_id as pkg_id,
          o.shop_name, o.escrow_amount, o.exchange_rate,
          o.gmt_order_start as order_time,
          o.app_package_status_text as status, o.app_package_status as status_raw,
          o.buyer_username,
          o.platform_order_sn,
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

      // ===== 复用sku-list同样的逻辑计算SKU单均数据 =====
      // 1. 包裹售价总和（用于回款分摊）
      const packageTotals = {};
      for (const r of rows) {
        if (!packageTotals[r.pkg_id]) packageTotals[r.pkg_id] = 0;
        packageTotals[r.pkg_id] += parseFloat(r.discounted_price) || 0;
      }

      // 2. SKU成本
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

      // 3. 广告费（与sku-list完全一致：IDR * 统一汇率 * 10%税）
      const [adData] = await pool.query(`
        SELECT platform_item_id, SUM(expense) as total_ad_idr
        FROM eb_ad_daily WHERE date >= ? AND date <= ? AND platform_item_id IS NOT NULL
        GROUP BY platform_item_id
      `, [start, end]);
      const adMap = {};
      adData.forEach(r => { adMap[r.platform_item_id] = (parseFloat(r.total_ad_idr) || 0) * FIXED_RATE * 1.1; });

      // 4. 与sku-list一样：先按SKU+店铺聚合，算出每个SKU的总量
      const skuAgg = {}; // { 'sku||store': { revenue, cost, packing, ad, orders, qty, itemIds } }
      const globalPackedSns = new Set();
      for (const item of rows) {
        const skuId = item.sku_id;
        if (!skuId) continue;
        const mapKey = skuId + '||' + (item.shop_name || '');
        if (!skuAgg[mapKey]) {
          skuAgg[mapKey] = { revenue: 0, cost: 0, packing: 0, ad: 0, orders: 0, qty: 0, itemIds: new Set(), orderSns: new Set() };
        }
        const s = skuAgg[mapKey];
        s.qty += item.quantity || 1;
        s.orderSns.add(item.platform_order_sn);

        // 回款（自带汇率）
        const xrate = parseFloat(item.exchange_rate) || 2450;
        const escrow = parseFloat(item.escrow_amount) || 0;
        const myPrice = parseFloat(item.discounted_price) || 0;
        const pkgTotal = packageTotals[item.pkg_id] || myPrice || 1;
        const ratio = pkgTotal > 0 ? myPrice / pkgTotal : 1;
        s.revenue += (escrow * ratio) / xrate;

        // 成本
        let unitCost = 0;
        if (item.goods_mode === 'bundle' && comboCostMap[skuId] !== undefined) unitCost = comboCostMap[skuId];
        else if (singleCostMap[skuId] !== undefined) unitCost = singleCostMap[skuId];
        s.cost += unitCost * (item.quantity || 1);

        // 打包费（全局订单编号去重）
        if (!globalPackedSns.has(item.platform_order_sn)) {
          s.packing += getPackingCost(item.warehouse_name);
          globalPackedSns.add(item.platform_order_sn);
        }

        if (item.platform_item_id) s.itemIds.add(String(item.platform_item_id));
      }

      // 订单数 = orderSn去重
      for (const s of Object.values(skuAgg)) { s.orders = s.orderSns.size; delete s.orderSns; }

      // 广告费分摊（与sku-list完全一致）
      const itemIdSkuOrders = {};
      for (const [mapKey, s] of Object.entries(skuAgg)) {
        for (const itemId of s.itemIds) {
          if (!itemIdSkuOrders[itemId]) itemIdSkuOrders[itemId] = {};
          itemIdSkuOrders[itemId][mapKey] = (itemIdSkuOrders[itemId][mapKey] || 0) + s.orders;
        }
      }
      for (const [mapKey, s] of Object.entries(skuAgg)) {
        for (const itemId of s.itemIds) {
          if (adMap[itemId] && itemIdSkuOrders[itemId]) {
            const totalOrders = Object.values(itemIdSkuOrders[itemId]).reduce((a, b) => a + b, 0);
            const myOrders = itemIdSkuOrders[itemId][mapKey] || 0;
            const ratio = totalOrders > 0 ? myOrders / totalOrders : 0;
            s.ad += adMap[itemId] * ratio;
          }
        }
        delete s.itemIds;
      }

      // 5. 算出每个SKU+店铺的单均值
      const skuUnitMap = {}; // { 'sku||store': { unitRevenue, unitCost, unitPacking, unitAd } }
      for (const [mapKey, s] of Object.entries(skuAgg)) {
        const orders = s.orders || 1;
        skuUnitMap[mapKey] = {
          unitRevenue: s.revenue / s.qty,    // 每件回款
          unitCost: s.cost / s.qty,          // 每件成本
          unitPacking: s.packing / orders,   // 每单打包
          unitAd: s.ad / orders,             // 每单广告
        };
      }

      // 6. 按包裹聚合订单，用单均值填充
      const orderMap = {};
      const orderPackedSns2 = new Set();
      for (const r of rows) {
        const key = r.pkg_id;
        if (!orderMap[key]) {
          orderMap[key] = {
            id: r.order_sn, store: r.shop_name,
            date: r.order_time ? new Date(r.order_time).toISOString().split('T')[0] : '',
            status: r.status, statusRaw: r.status_raw, buyer: r.buyer_username,
            warehouseName: shortWarehouse(r.warehouse_name),
            items: [], revenue: 0, cost: 0, packing: 0, ad: 0, profit: 0, qty: 0
          };
        }
        const ord = orderMap[key];
        const mapKey = (r.sku_id || '') + '||' + (r.shop_name || '');
        const unit = skuUnitMap[mapKey] || { unitRevenue: 0, unitCost: 0, unitPacking: 0, unitAd: 0 };
        const qty = r.quantity || 1;

        const itemRevenue = unit.unitRevenue * qty;
        const itemCost = unit.unitCost * qty;
        const itemAd = unit.unitAd; // 每单广告（不乘qty，因为是按单均摊的）

        ord.items.push({
          sku: r.sku_id, name: r.sku_name || '', qty,
          revenue: itemRevenue, cost: itemCost, ad: itemAd,
          profit: itemRevenue - itemCost - itemAd
        });

        ord.revenue += itemRevenue;
        ord.cost += itemCost;
        // 打包费按订单编号去重
        if (!orderPackedSns2.has(r.order_sn)) {
          ord.packing += unit.unitPacking;
          orderPackedSns2.add(r.order_sn);
        }
        ord.ad += itemAd;
        ord.qty += qty;
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

      // 概览(统计已完成+已发货+待发货，与SKU利润页一致)
      const validStatuses = ['finished', 'wait_receiver_confirm', 'wait_seller_send'];
      const validOrders = result.filter(o => validStatuses.includes(o.statusRaw));
      const overview = {
        totalOrders: result.length,
        validOrders: validOrders.length,
        finishedOrders: result.filter(o => o.statusRaw === 'finished').length,
        shippedOrders: result.filter(o => o.statusRaw === 'wait_receiver_confirm').length,
        profitOrders: validOrders.filter(o => o.profit > 0).length,
        lossOrders: validOrders.filter(o => o.profit <= 0).length,
        avgProfit: validOrders.length > 0 ? validOrders.reduce((s, o) => s + o.profit, 0) / validOrders.length : 0,
        totalProfit: validOrders.reduce((s, o) => s + o.profit, 0),
        totalRevenue: validOrders.reduce((s, o) => s + o.revenue, 0),
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
      // 权限过滤
      ({ whereClause: orderWhere, params: orderParams } = applyShopFilter(orderWhere, orderParams, req));

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
        SELECT platform_item_id, SUM(expense) as total_ad_idr, SUM(expense_cny) as total_ad_cny
        FROM eb_ad_daily WHERE date >= ? AND date <= ? AND platform_item_id IS NOT NULL
        GROUP BY platform_item_id
      `, [start, end]);
      const adMap = {};
      adData.forEach(r => { adMap[r.platform_item_id] = (parseFloat(r.total_ad_idr) || 0) * FIXED_RATE * 1.1; });

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
        const xrate = parseFloat(r.exchange_rate) || 2450; // 自带汇率
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
        const packCost = 3.2;

        let itemAd = 0;
        if (r.platform_item_id && adMap[String(r.platform_item_id)]) {
          const itemId = String(r.platform_item_id);
          const skuOrders = itemIdSkuOrders[itemId] || {};
          const totalOrders = Object.values(skuOrders).reduce((a, b) => a + b, 0);
          const myOrders = skuOrders[r.sku_id] || 0;
          const adRatio = totalOrders > 0 ? myOrders / totalOrders : 0;
          const myAdOrders = skuOrders[r.sku_id] || 1;
          itemAd = myAdOrders > 0 ? (adMap[itemId] * adRatio) / myAdOrders : 0;
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

  // ==================== 链接利润 ====================
  router.get('/link-list', async (req, res) => {
    try {
      const { range = 'today', shop, keyword, startDate, endDate } = req.query;
      const { start, end } = getDateRange(range, startDate, endDate);

      let orderWhere = `WHERE DATE(o.gmt_order_start) >= ? AND DATE(o.gmt_order_start) <= ?`;
      let orderParams = [start, end];
      orderWhere += ` AND o.app_package_status NOT IN ('cancelled', 'returned', 'unpaid', 'refunding')`;
      if (shop) { orderWhere += ` AND o.shop_name = ?`; orderParams.push(shop); }
      // 权限过滤
      ({ whereClause: orderWhere, params: orderParams } = applyShopFilter(orderWhere, orderParams, req));

      const [orderItems] = await pool.query(`
        SELECT 
          oi.goods_sku_outer_id as sku_id, oi.goods_name as sku_name, oi.goods_mode,
          oi.warehouse_name, oi.platform_item_id, oi.quantity, oi.discounted_price,
          oi.op_order_package_id, o.escrow_amount, o.exchange_rate,
          o.shop_name, o.platform_order_sn
        FROM eb_order_items oi
        JOIN eb_orders o ON oi.op_order_package_id = o.op_order_package_id
        ${orderWhere}
      `, orderParams);

      if (orderItems.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // 包裹售价总和（用于分摊回款）
      const packageTotals = {};
      for (const item of orderItems) {
        const pkgId = item.op_order_package_id;
        if (!packageTotals[pkgId]) packageTotals[pkgId] = 0;
        packageTotals[pkgId] += parseFloat(item.discounted_price) || 0;
      }

      // SKU成本
      const allSkus = [...new Set(orderItems.map(i => i.sku_id).filter(Boolean))];
      if (allSkus.length === 0) return res.json({ success: true, data: [] });
      const ph = allSkus.map(() => '?').join(',');

      const [singleCosts] = await pool.query(
        `SELECT sku, purchase_price FROM eb_sku_costs WHERE sku IN (${ph})`, allSkus
      );
      const singleCostMap = {};
      singleCosts.forEach(r => { singleCostMap[r.sku] = parseFloat(r.purchase_price) || 0; });

      const [comboCosts] = await pool.query(
        `SELECT c.combo_sku, c.item_sku, c.quantity, s.purchase_price
         FROM eb_sku_combos c LEFT JOIN eb_sku_costs s ON c.item_sku = s.sku
         WHERE c.combo_sku IN (${ph})`, allSkus
      );
      const comboCostMap = {};
      comboCosts.forEach(r => {
        if (!comboCostMap[r.combo_sku]) comboCostMap[r.combo_sku] = 0;
        comboCostMap[r.combo_sku] += (parseFloat(r.purchase_price) || 0) * (r.quantity || 1);
      });

      // 广告数据（按链接直接查，100%归属）
      const [adData] = await pool.query(`
        SELECT platform_item_id, SUM(expense) as total_ad_idr
        FROM eb_ad_daily
        WHERE date >= ? AND date <= ? AND platform_item_id IS NOT NULL
        GROUP BY platform_item_id
      `, [start, end]);
      const adMap = {};
      adData.forEach(r => { adMap[r.platform_item_id] = (parseFloat(r.total_ad_idr) || 0) * FIXED_RATE * 1.1; });

      // 按 platform_item_id + sku 双层聚合
      const linkMap = {}; // { itemId: { info, skuMap: { sku: {...} } } }
      const globalPackedSns = new Set();

      for (const item of orderItems) {
        const itemId = String(item.platform_item_id || 'unknown');
        const skuId = item.sku_id || 'unknown';

        if (!linkMap[itemId]) {
          linkMap[itemId] = {
            itemId, store: item.shop_name || '', warehouse: shortWarehouse(item.warehouse_name),
            orders: 0, qty: 0, revenue: 0, cost: 0, packing: 0, ad: 0, profit: 0,
            orderSns: new Set(), skuMap: {}
          };
        }
        const link = linkMap[itemId];

        if (!link.skuMap[skuId]) {
          link.skuMap[skuId] = {
            sku: skuId, name: item.sku_name || '', orders: 0, qty: 0,
            revenue: 0, cost: 0, packing: 0, ad: 0, profit: 0, orderSns: new Set()
          };
        }
        const skuEntry = link.skuMap[skuId];

        // 回款
        const xrate = parseFloat(item.exchange_rate) || 2450;
        const escrow = parseFloat(item.escrow_amount) || 0;
        const myPrice = parseFloat(item.discounted_price) || 0;
        const pkgTotal = packageTotals[item.op_order_package_id] || myPrice || 1;
        const ratio = pkgTotal > 0 ? myPrice / pkgTotal : 1;
        const rev = escrow * ratio / xrate;

        link.revenue += rev;
        skuEntry.revenue += rev;

        // 成本
        let unitCost = 0;
        if (item.goods_mode === 'bundle' && comboCostMap[skuId] !== undefined) {
          unitCost = comboCostMap[skuId];
        } else if (singleCostMap[skuId] !== undefined) {
          unitCost = singleCostMap[skuId];
        }
        const costVal = unitCost * (item.quantity || 1);
        link.cost += costVal;
        skuEntry.cost += costVal;

        // 件数
        const qty = item.quantity || 1;
        link.qty += qty;
        skuEntry.qty += qty;

        // 打包（全局按订单去重）
        if (!globalPackedSns.has(item.platform_order_sn)) {
          const packCost = getPackingCost(item.warehouse_name);
          link.packing += packCost;
          skuEntry.packing += packCost;
          globalPackedSns.add(item.platform_order_sn);
        }

        // 订单去重
        link.orderSns.add(item.platform_order_sn);
        skuEntry.orderSns.add(item.platform_order_sn);
      }

      // 广告费分摊到链接内各SKU（按订单量占比）
      const result = [];
      for (const [itemId, link] of Object.entries(linkMap)) {
        link.orders = link.orderSns.size;
        delete link.orderSns;
        link.ad = adMap[itemId] || 0;

        // SKU列表
        const skus = [];
        let totalSkuOrders = 0;
        for (const [skuId, s] of Object.entries(link.skuMap)) {
          s.orders = s.orderSns.size;
          delete s.orderSns;
          totalSkuOrders += s.orders;
          skus.push(s);
        }

        // 按订单量分摊广告费
        for (const s of skus) {
          const adRatio = totalSkuOrders > 0 ? s.orders / totalSkuOrders : 0;
          s.ad = link.ad * adRatio;
          s.profit = s.revenue - s.cost - s.packing - s.ad;
        }
        skus.sort((a, b) => b.orders - a.orders);

        link.profit = link.revenue - link.cost - link.packing - link.ad;
        link.roi = link.ad > 0 ? link.revenue / link.ad : (link.revenue > 0 ? 999 : 0);
        link.rate = link.revenue > 0 ? (link.profit / link.revenue) * 100 : 0;
        link.mainName = skus.length > 0 ? skus[0].name : '';
        link.mainSku = skus.length > 0 ? skus[0].sku : '';
        link.skuCount = skus.length;
        link.skus = skus;
        delete link.skuMap;
        result.push(link);
      }

      // 按利润排序
      result.sort((a, b) => b.profit - a.profit);

      // 过滤
      let filtered = result;
      if (keyword) {
        const kw = keyword.toLowerCase();
        filtered = result.filter(l =>
          l.itemId.includes(kw) || l.mainName.toLowerCase().includes(kw) ||
          l.skus.some(s => s.sku.toLowerCase().includes(kw) || s.name.toLowerCase().includes(kw))
        );
      }

      res.json({ success: true, data: filtered });
    } catch (err) {
      console.error('[链接利润] 查询失败:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });


  return router;
};

