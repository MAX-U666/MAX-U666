/**
 * SKU利润计算路由
 * 回款按包裹内SKU售价比例分摊
 */

const express = require('express');

module.exports = function(pool) {
  const router = express.Router();

  function getDateRange(range) {
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
    if (!warehouseName) return 1.5;
    const name = warehouseName.toUpperCase();
    if (name.includes('MOMO')) return 2000 / (exchangeRate || 2450);
    if (name.includes('BBT')) return 3;
    return 1.5;
  }

  router.get('/sku-list', async (req, res) => {
    try {
      const { range = 'today', shop, keyword } = req.query;
      const { start, end } = getDateRange(range);

      let orderWhere = `WHERE DATE(o.gmt_order_start) >= ? AND DATE(o.gmt_order_start) <= ?`;
      let orderParams = [start, end];
      orderWhere += ` AND o.app_package_status NOT IN ('cancelled', 'refunded')`;
      
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
      adData.forEach(r => { adMap[r.platform_item_id] = parseFloat(r.total_ad_cny) || 0; });

      // 聚合SKU利润
      const skuMap = {};
      
      for (const item of orderItems) {
        const skuId = item.sku_id;
        if (!skuId) continue;
        
        if (!skuMap[skuId]) {
          skuMap[skuId] = {
            sku: skuId, name: item.sku_name || '', store: item.shop_name || '',
            orders: 0, revenue: 0, cost: 0, packing: 0, ad: 0,
            profit: 0, roi: 0, rate: 0, warehouse: 0, itemIds: new Set()
          };
        }

        const s = skuMap[skuId];
        s.orders += item.quantity || 1;
        
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

      // 广告费 + 利润
      for (const sku of Object.values(skuMap)) {
        for (const itemId of sku.itemIds) {
          if (adMap[itemId]) sku.ad += adMap[itemId];
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

      const overview = {
        totalSku: result.length,
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

  function getEmptyOverview() {
    return { totalSku: 0, profitSku: 0, lossSku: 0, roiReached: 0,
      totalProfit: 0, totalRevenue: 0, totalCost: 0, totalAd: 0, totalPacking: 0 };
  }

  return router;
};
