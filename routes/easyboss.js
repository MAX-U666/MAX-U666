/**
 * EasyBoss API 路由
 * 提供数据拉取、查询、调度管理等接口
 */

const express = require('express');
const EasyBossScheduler = require('../services/easyboss/scheduler');

module.exports = function(pool) {
  const router = express.Router();
  const scheduler = new EasyBossScheduler(pool);

  // =============================================
  // 数据拉取控制
  // =============================================

  /**
   * POST /api/easyboss/fetch
   * 手动触发一次数据拉取
   */
  router.post('/fetch', async (req, res) => {
    try {
      const { shopId, dateFrom, dateTo } = req.body;
      const result = await scheduler.runOnce({ shopId, dateFrom, dateTo });
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/easyboss/scheduler/start
   * 启动定时拉取
   */
  router.post('/scheduler/start', (req, res) => {
    const { intervalHours = 4 } = req.body;
    scheduler.start(intervalHours);
    res.json({ success: true, message: `定时任务已启动，间隔 ${intervalHours} 小时` });
  });

  /**
   * POST /api/easyboss/scheduler/stop
   * 停止定时拉取
   */
  router.post('/scheduler/stop', (req, res) => {
    scheduler.stop();
    res.json({ success: true, message: '定时任务已停止' });
  });

  /**
   * GET /api/easyboss/status
   * 获取调度器和登录状态
   */
  router.get('/status', (req, res) => {
    res.json(scheduler.getStatus());
  });

  // =============================================
  // 数据查询
  // =============================================

  /**
   * GET /api/easyboss/metrics
   * 查询广告数据
   * 参数: ?date=2025-01-20&shopId=A107&days=7
   */
  router.get('/metrics', async (req, res) => {
    try {
      const { date, shopId, days = 7 } = req.query;
      const data = await scheduler.fetcher.getSavedMetrics({
        date,
        shopId,
        days: parseInt(days)
      });
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/summary
   * 获取汇总数据
   * 参数: ?days=7&shopId=A107
   */
  router.get('/summary', async (req, res) => {
    try {
      const { days = 7, shopId } = req.query;
      const data = await scheduler.fetcher.getSummary({
        days: parseInt(days),
        shopId
      });
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/logs
   * 获取拉取日志
   */
  router.get('/logs', async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      const logs = await scheduler.getLogs(parseInt(limit));
      res.json({ success: true, logs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =============================================
  // 数据维护
  // =============================================

  /**
   * POST /api/easyboss/clean
   * 清理过期数据
   */
  router.post('/clean', async (req, res) => {
    try {
      const { keepDays = 30 } = req.body;
      const deleted = await scheduler.cleanOldData(keepDays);
      res.json({ success: true, deleted });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/shops
   * 获取已有的店铺列表
   */
  router.get('/shops', async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT DISTINCT shop_id, shop_name, COUNT(*) as records, MAX(date) as last_date
         FROM eb_ad_metrics 
         GROUP BY shop_id, shop_name 
         ORDER BY records DESC`
      );
      res.json({ success: true, data: rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =============================================
  // 订单数据（EasyBoss 内部API直调）
  // =============================================

  const EasyBossOrderFetcher = require('../services/easyboss/fetch-orders');
  const orderFetcher = new EasyBossOrderFetcher(pool);

  /**
   * POST /api/easyboss/orders/set-cookie
   * 设置EasyBoss浏览器Cookie
   * Body: { cookie: "dmerp_sid=xxx; loginTokenS=xxx; ..." }
   */
  router.post('/orders/set-cookie', async (req, res) => {
    try {
      const { cookie } = req.body || {};
      if (!cookie || cookie.length < 10) {
        return res.status(400).json({ success: false, error: '请提供有效的cookie字符串' });
      }

      // 确保 eb_config 表存在
      await pool.query(`
        CREATE TABLE IF NOT EXISTS eb_config (
          config_key VARCHAR(100) PRIMARY KEY,
          config_value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // 保存cookie
      await pool.query(
        `INSERT INTO eb_config (config_key, config_value) VALUES ('easyboss_cookie', ?)
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
        [cookie]
      );

      // 清除缓存，下次拉取时读取新cookie
      orderFetcher.clearCookies();

      res.json({ success: true, message: 'Cookie已保存', length: cookie.length });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/orders/cookie-status
   * 查看当前Cookie状态
   */
  router.get('/orders/cookie-status', async (req, res) => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS eb_config (
          config_key VARCHAR(100) PRIMARY KEY,
          config_value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      const [rows] = await pool.query(
        "SELECT config_value, updated_at FROM eb_config WHERE config_key = 'easyboss_cookie'"
      );
      if (rows.length && rows[0].config_value) {
        res.json({
          success: true,
          configured: true,
          cookieLength: rows[0].config_value.length,
          updatedAt: rows[0].updated_at
        });
      } else {
        res.json({ success: true, configured: false });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/easyboss/orders/fetch
   * 触发订单数据拉取
   * Body: { days: 7, dateFrom: '', dateTo: '', status: 'all' }
   */
  router.post('/orders/fetch', async (req, res) => {
    try {
      const { days, dateFrom, dateTo, status } = req.body || {};
      const result = await orderFetcher.run({ days, dateFrom, dateTo, status });
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/orders/list
   * 查询已入库的订单
   */
  router.get('/orders/list', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize) || 50, 100);
      const offset = (page - 1) * pageSize;

      let where = '1=1';
      const params = [];

      if (req.query.shop) {
        where += ' AND shop_name = ?';
        params.push(req.query.shop);
      }
      if (req.query.shopId) {
        where += ' AND shop_id = ?';
        params.push(req.query.shopId);
      }
      if (req.query.status) {
        where += ' AND app_package_tab = ?';
        params.push(req.query.status);
      }
      if (req.query.dateFrom) {
        where += ' AND gmt_order_start >= ?';
        params.push(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        where += ' AND gmt_order_start <= ?';
        params.push(req.query.dateTo);
      }
      if (req.query.keyword) {
        where += ' AND (platform_order_sn LIKE ? OR buyer_username LIKE ? OR shop_name LIKE ?)';
        const kw = `%${req.query.keyword}%`;
        params.push(kw, kw, kw);
      }

      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM eb_orders WHERE ${where}`, params
      );
      const total = countResult[0].total;

      const [orders] = await pool.query(
        `SELECT * FROM eb_orders WHERE ${where} ORDER BY gmt_order_start DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );

      res.json({
        success: true,
        orders,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/orders/stats
   * 订单统计汇总
   */
  router.get('/orders/stats', async (req, res) => {
    try {
      let where = '1=1';
      const params = [];

      if (req.query.shopId) {
        where += ' AND shop_id = ?';
        params.push(req.query.shopId);
      }
      if (req.query.dateFrom) {
        where += ' AND gmt_order_start >= ?';
        params.push(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        where += ' AND gmt_order_start <= ?';
        params.push(req.query.dateTo);
      }

      const [result] = await pool.query(`
        SELECT
          COUNT(*) as total_orders,
          SUM(CASE WHEN platform_order_status != 'CANCELLED' THEN pay_amount ELSE 0 END) as total_gmv,
          SUM(order_profit) as total_profit,
          COUNT(DISTINCT shop_name) as shop_count
        FROM eb_orders WHERE ${where}
      `, params);

      const summary = result[0];
      const profitMargin = summary.total_gmv > 0
        ? ((summary.total_profit / summary.total_gmv) * 100).toFixed(1) + '%'
        : '0%';

      // 按店铺统计
      const [shopStats] = await pool.query(`
        SELECT
          shop_name,
          COUNT(*) as count,
          SUM(CASE WHEN platform_order_status != 'CANCELLED' THEN pay_amount ELSE 0 END) as total_pay
        FROM eb_orders WHERE ${where}
        GROUP BY shop_name
        ORDER BY count DESC
      `, params);

      // 按状态统计
      const [statusStats] = await pool.query(`
        SELECT
          app_package_tab as status,
          COUNT(*) as count
        FROM eb_orders WHERE ${where}
        GROUP BY app_package_tab
        ORDER BY count DESC
      `, params);

      res.json({
        success: true,
        totalOrders: summary.total_orders,
        totalGMV: summary.total_gmv,
        totalProfit: summary.total_profit,
        avgProfitMargin: profitMargin,
        shops: shopStats,
        statusBreakdown: statusStats,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/orders/detail/:packageId
   * 单个订单详情（含商品）
   */
  router.get('/orders/detail/:packageId', async (req, res) => {
    try {
      const { packageId } = req.params;
      const [orders] = await pool.query(
        'SELECT * FROM eb_orders WHERE op_order_package_id = ?', [packageId]
      );
      if (!orders.length) {
        return res.status(404).json({ success: false, error: '订单不存在' });
      }
      const [items] = await pool.query(
        'SELECT * FROM eb_order_items WHERE op_order_package_id = ?', [packageId]
      );
      res.json({ success: true, order: orders[0], items });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/orders/logs
   * 订单拉取日志
   */
  router.get('/orders/logs', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const [logs] = await pool.query(
        'SELECT * FROM eb_order_fetch_logs ORDER BY created_at DESC LIMIT ?', [limit]
      );
      res.json({ success: true, logs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =============================================
  // 广告数据
  // =============================================

  const AdsFetcher = require('../services/easyboss/fetch-ads');
  const adsFetcher = new AdsFetcher(pool);

  /**
   * POST /api/easyboss/ads/fetch
   * 触发广告数据拉取
   * Body: { status: 'ongoing', fetchDaily: true, dailyDays: 30 }
   */
  router.post('/ads/fetch', async (req, res) => {
    try {
      const { status = 'ongoing', fetchDaily = true, dailyDays = 30 } = req.body || {};
      const result = await adsFetcher.run({ status, fetchDaily, dailyDays });
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/ads/campaigns
   * 查询广告活动列表
   */
  router.get('/ads/campaigns', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize) || 50, 100);
      const offset = (page - 1) * pageSize;

      let where = '1=1';
      const params = [];

      if (req.query.status) {
        where += ' AND campaign_status = ?';
        params.push(req.query.status);
      }
      if (req.query.shopId) {
        where += ' AND shop_id = ?';
        params.push(req.query.shopId);
      }
      if (req.query.matched === 'true') {
        where += ' AND platform_item_id IS NOT NULL';
      }

      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM eb_ad_campaigns WHERE ${where}`, params
      );
      const total = countResult[0].total;

      const [campaigns] = await pool.query(
        `SELECT * FROM eb_ad_campaigns WHERE ${where} ORDER BY expense DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );

      res.json({ success: true, campaigns, total, page, pageSize });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/ads/stats
   * 广告统计汇总
   */
  router.get('/ads/stats', async (req, res) => {
    try {
      let where = '1=1';
      const params = [];

      if (req.query.status) {
        where += ' AND campaign_status = ?';
        params.push(req.query.status);
      }

      const [summary] = await pool.query(`
        SELECT
          COUNT(*) as total_campaigns,
          SUM(expense) as total_expense,
          SUM(broad_gmv) as total_gmv,
          SUM(broad_order) as total_orders,
          SUM(direct_gmv) as total_direct_gmv,
          SUM(direct_order) as total_direct_orders,
          COUNT(DISTINCT shop_id) as shop_count,
          SUM(CASE WHEN platform_item_id IS NOT NULL THEN 1 ELSE 0 END) as matched_count
        FROM eb_ad_campaigns WHERE ${where}
      `, params);

      const s = summary[0];
      const overallRoi = s.total_expense > 0 ? (s.total_gmv / s.total_expense).toFixed(2) : '0';

      // 按店铺统计
      const [byShop] = await pool.query(`
        SELECT shop_id, COUNT(*) as campaigns,
          SUM(expense) as expense, SUM(broad_gmv) as gmv,
          SUM(broad_order) as orders
        FROM eb_ad_campaigns WHERE ${where}
        GROUP BY shop_id ORDER BY expense DESC
      `, params);

      res.json({
        success: true,
        totalCampaigns: s.total_campaigns,
        totalExpense: s.total_expense,
        totalGmv: s.total_gmv,
        totalOrders: s.total_orders,
        overallRoi,
        matchedCount: s.matched_count,
        shopCount: s.shop_count,
        byShop,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/ads/daily
   * 广告每日明细（支持按campaign/shop/日期筛选）
   */
  router.get('/ads/daily', async (req, res) => {
    try {
      let where = '1=1';
      const params = [];

      if (req.query.campaignId) {
        where += ' AND platform_campaign_id = ?';
        params.push(req.query.campaignId);
      }
      if (req.query.shopId) {
        where += ' AND shop_id = ?';
        params.push(req.query.shopId);
      }
      if (req.query.dateFrom) {
        where += ' AND date >= ?';
        params.push(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        where += ' AND date <= ?';
        params.push(req.query.dateTo);
      }

      const [records] = await pool.query(
        `SELECT * FROM eb_ad_daily WHERE ${where} ORDER BY date DESC LIMIT 500`,
        params
      );

      res.json({ success: true, records, count: records.length });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =============================================
  // 商品中心
  // =============================================

  const ProductsFetcher = require('../services/easyboss/fetch-products');
  const productsFetcher = new ProductsFetcher(pool);

  /**
   * POST /api/easyboss/products/fetch
   * 触发商品数据拉取 + 广告匹配
   * Body: { status: 'onsale', matchAds: true }
   */
  router.post('/products/fetch', async (req, res) => {
    try {
      const { status = '', matchAds = true } = req.body || {};
      const result = await productsFetcher.run({ status, matchAds });
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/products/list
   * 商品列表查询
   */
  router.get('/products/list', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize) || 50, 100);
      const offset = (page - 1) * pageSize;

      let where = '1=1';
      const params = [];

      if (req.query.shopId) {
        where += ' AND shop_id = ?';
        params.push(req.query.shopId);
      }
      if (req.query.status) {
        where += ' AND status = ?';
        params.push(req.query.status);
      }
      if (req.query.keyword) {
        where += ' AND title LIKE ?';
        params.push(`%${req.query.keyword}%`);
      }

      const sortField = req.query.sortBy === 'sell' ? 'sell_cnt' :
                        req.query.sortBy === 'stock' ? 'stock' :
                        req.query.sortBy === 'price' ? 'sale_price' :
                        req.query.sortBy === 'rating' ? 'rating_star' : 'sell_cnt';

      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM eb_products WHERE ${where}`, params
      );

      const [products] = await pool.query(
        `SELECT * FROM eb_products WHERE ${where} ORDER BY ${sortField} DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );

      res.json({
        success: true,
        products,
        total: countResult[0].total,
        page,
        pageSize,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/products/stats
   * 商品统计汇总
   */
  router.get('/products/stats', async (req, res) => {
    try {
      const [summary] = await pool.query(`
        SELECT
          COUNT(*) as total_products,
          SUM(CASE WHEN status = 'onsale' THEN 1 ELSE 0 END) as onsale,
          SUM(CASE WHEN status = 'soldout' THEN 1 ELSE 0 END) as soldout,
          SUM(sell_cnt) as total_sold,
          SUM(stock) as total_stock,
          COUNT(DISTINCT shop_id) as shop_count,
          AVG(rating_star) as avg_rating
        FROM eb_products
      `);

      const [byShop] = await pool.query(`
        SELECT shop_id, COUNT(*) as products, SUM(sell_cnt) as sold, SUM(stock) as stock
        FROM eb_products WHERE status = 'onsale'
        GROUP BY shop_id ORDER BY sold DESC
      `);

      // 广告匹配统计
      const [adMatch] = await pool.query(`
        SELECT 
          COUNT(*) as total_ads,
          SUM(CASE WHEN platform_item_id IS NOT NULL THEN 1 ELSE 0 END) as matched
        FROM eb_ad_campaigns
      `);

      res.json({
        success: true,
        ...summary[0],
        byShop,
        adMatchRate: adMatch[0].total_ads > 0
          ? ((adMatch[0].matched / adMatch[0].total_ads) * 100).toFixed(1) + '%'
          : '0%',
        adMatched: adMatch[0].matched,
        adTotal: adMatch[0].total_ads,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/products/:itemId
   * 单个商品详情（含关联广告和订单数据）
   */
  router.get('/products/:itemId', async (req, res) => {
    try {
      const { itemId } = req.params;

      const [products] = await pool.query(
        'SELECT * FROM eb_products WHERE platform_item_id = ?', [itemId]
      );
      if (products.length === 0) {
        return res.status(404).json({ success: false, error: '商品不存在' });
      }

      // 关联广告
      const [ads] = await pool.query(
        'SELECT * FROM eb_ad_campaigns WHERE platform_item_id = ?', [itemId]
      );

      // 关联订单
      const [orders] = await pool.query(
        `SELECT COUNT(*) as order_count, SUM(total_pay) as total_gmv
         FROM eb_orders o JOIN eb_order_items i ON o.order_id = i.order_id
         WHERE i.platform_item_id = ?`, [itemId]
      );

      res.json({
        success: true,
        product: products[0],
        ads,
        orderStats: orders[0],
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 优雅关闭（加 try-catch 防止 shutdown 报错导致崩溃循环）
  process.on('SIGTERM', async () => {
    try { await scheduler.shutdown(); } catch(e) { console.error('[Shutdown] SIGTERM error:', e.message); }
  });

  process.on('SIGINT', async () => {
    try { await scheduler.shutdown(); } catch(e) { console.error('[Shutdown] SIGINT error:', e.message); }
  });

  return router;
};
