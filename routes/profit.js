/**
 * SKU利润计算路由
 * 基于 eb_orders + eb_order_items + eb_sku_costs + eb_sku_combos + eb_ad_daily
 */

const express = require('express');

module.exports = function(pool) {
  const router = express.Router();

  /**
   * 日期范围辅助函数
   */
  function getDateRange(range) {
    const now = new Date();
    // 用UTC+7（印尼时间）计算
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

  /**
   * 包材费计算（按仓库）
   */
  function getPackingCost(warehouseName, exchangeRate) {
    if (!warehouseName) return 1.5;
    const name = warehouseName.toUpperCase();
    if (name.includes('MOMO')) return 2000 / (exchangeRate || 2414.68); // 2000 IDR 转 CNY
    if (name.includes('BBT')) return 3;
    return 1.5;
  }

  /**
   * 核心接口：SKU利润列表
   * GET /api/profit/sku-list?range=today&shop=&keyword=
   */
  router.get('/sku-list', async (req, res) => {
    try {
      const { range = 'today', shop, keyword } = req.query;
      const { start, end } = getDateRange(range);

      // 1. 查询订单+明细数据
      let orderWhere = `WHERE DATE(o.gmt_order_start) >= ? AND DATE(o.gmt_order_start) <= ?`;
      let orderParams = [start, end];
      
      // 排除取消/退款的订单
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
          o.escrow_amount,
          o.exchange_rate,
          o.shop_name,
          o.platform_order_sn,
          o.op_order_package_id
        FROM eb_order_items oi
        JOIN eb_orders o ON oi.op_order_package_id = o.op_order_package_id
        ${orderWhere}
      `, orderParams);

      if (orderItems.length === 0) {
        return res.json({ success: true, data: [], overview: getEmptyOverview() });
      }

      // 2. 获取所有涉及的SKU成本
      const allSkus = [...new Set(orderItems.map(i => i.sku_id))];
      const skuPlaceholders = allSkus.map(() => '?').join(',');
      
      // 查单品成本
      const [singleCosts] = await pool.query(
        `SELECT sku, purchase_price FROM eb_sku_costs WHERE sku IN (${skuPlaceholders})`,
        allSkus
      );
      const singleCostMap = {};
      singleCosts.forEach(r => { singleCostMap[r.sku] = parseFloat(r.purchase_price) || 0; });

      // 查组合成本
      const [comboCosts] = await pool.query(
        `SELECT c.combo_sku, c.item_sku, c.quantity, s.purchase_price
         FROM eb_sku_combos c
         LEFT JOIN eb_sku_costs s ON c.item_sku = s.sku
         WHERE c.combo_sku IN (${skuPlaceholders})`,
        allSkus
      );
      const comboCostMap = {};
      comboCosts.forEach(r => {
        if (!comboCostMap[r.combo_sku]) comboCostMap[r.combo_sku] = 0;
        comboCostMap[r.combo_sku] += (parseFloat(r.purchase_price) || 0) * (r.quantity || 1);
      });

      // 3. 获取广告数据（有platform_item_id的）
      const [adData] = await pool.query(`
        SELECT platform_item_id, SUM(expense_cny) as total_ad_cny
        FROM eb_ad_daily
        WHERE date >= ? AND date <= ? AND platform_item_id IS NOT NULL
        GROUP BY platform_item_id
      `, [start, end]);
      const adMap = {};
      adData.forEach(r => { adMap[r.platform_item_id] = parseFloat(r.total_ad_cny) || 0; });

      // 4. 聚合SKU利润
      const skuMap = {};
      
      for (const item of orderItems) {
        const skuId = item.sku_id;
        if (!skuId) continue;
        
        if (!skuMap[skuId]) {
          skuMap[skuId] = {
            sku: skuId,
            name: item.sku_name || '',
            store: item.shop_name || '',
            orders: 0,
            revenue: 0,      // 回款(CNY)
            cost: 0,          // 商品成本(CNY)
            packing: 0,       // 包材费(CNY)
            ad: 0,            // 广告费(CNY)
            profit: 0,
            roi: 0,
            rate: 0,
            warehouse: 0,     // 预留字段
            itemIds: new Set() // 用于匹配广告
          };
        }

        const s = skuMap[skuId];
        s.orders += item.quantity || 1;
        
        // 回款(CNY) = escrow_amount / exchange_rate
        const rate = parseFloat(item.exchange_rate) || 2414.68;
        const revenueCNY = parseFloat(item.escrow_amount) / rate;
        s.revenue += revenueCNY;

        // 商品成本(CNY)
        let unitCost = 0;
        if (item.goods_mode === 'bundle' && comboCostMap[skuId] !== undefined) {
          unitCost = comboCostMap[skuId];
        } else if (singleCostMap[skuId] !== undefined) {
          unitCost = singleCostMap[skuId];
        }
        s.cost += unitCost * (item.quantity || 1);

        // 包材费(按仓库，每个包裹一次)
        s.packing += getPackingCost(item.warehouse_name, rate);

        // 记录platform_item_id用于匹配广告
        if (item.platform_item_id) {
          s.itemIds.add(String(item.platform_item_id));
        }
      }

      // 5. 分配广告费
      for (const sku of Object.values(skuMap)) {
        for (const itemId of sku.itemIds) {
          if (adMap[itemId]) {
            sku.ad += adMap[itemId];
          }
        }
        delete sku.itemIds; // 清理

        // 计算利润
        sku.profit = sku.revenue - sku.cost - sku.packing - sku.ad;
        sku.roi = sku.ad > 0 ? sku.revenue / sku.ad : (sku.revenue > 0 ? 999 : 0);
        sku.rate = sku.revenue > 0 ? (sku.profit / sku.revenue) * 100 : 0;
      }

      // 6. 转数组 + 搜索过滤
      let result = Object.values(skuMap);
      
      if (keyword) {
        const kw = keyword.toLowerCase();
        result = result.filter(s => 
          s.sku.toLowerCase().includes(kw) || 
          s.name.toLowerCase().includes(kw)
        );
      }

      // 按利润排序
      result.sort((a, b) => b.profit - a.profit);

      // 7. 计算概览
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

      // 8. 店铺列表（用于前端筛选）
      const shops = [...new Set(orderItems.map(i => i.shop_name).filter(Boolean))];

      res.json({ success: true, data: result, overview, shops, dateRange: { start, end } });
    } catch (err) {
      console.error('[SKU利润] 查询失败:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 店铺广告费（无item_id的）
   * GET /api/profit/shop-ad?range=today
   */
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
    return {
      totalSku: 0, profitSku: 0, lossSku: 0, roiReached: 0,
      totalProfit: 0, totalRevenue: 0, totalCost: 0, totalAd: 0, totalPacking: 0
    };
  }

  return router;
};
