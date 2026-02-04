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
      const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 100);
      const offset = (page - 1) * pageSize;

      let where = '1=1';
      const params = [];

      if (req.query.shopId) {
        where += ' AND shop_id = ?';
        params.push(req.query.shopId);
      }
      if (req.query.status) {
        where += ' AND platform_order_status = ?';
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
        data: orders,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
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
          SUM(CASE WHEN platform_order_status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN platform_order_status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN platform_order_status NOT IN ('COMPLETED','CANCELLED') THEN 1 ELSE 0 END) as processing,
          SUM(CASE WHEN platform_order_status != 'CANCELLED' THEN order_amount ELSE 0 END) as total_gmv,
          SUM(CASE WHEN platform_order_status = 'COMPLETED' THEN order_amount ELSE 0 END) as completed_gmv,
          SUM(CASE WHEN platform_order_status != 'CANCELLED' THEN item_quantity ELSE 0 END) as total_items,
          COUNT(DISTINCT shop_id) as shop_count
        FROM eb_orders WHERE ${where}
      `, params);

      const [shopStats] = await pool.query(`
        SELECT
          shop_id, shop_name, platform_shop_name,
          COUNT(*) as orders,
          SUM(CASE WHEN platform_order_status != 'CANCELLED' THEN order_amount ELSE 0 END) as gmv,
          SUM(CASE WHEN platform_order_status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
        FROM eb_orders WHERE ${where}
        GROUP BY shop_id, shop_name, platform_shop_name
        ORDER BY gmv DESC
      `, params);

      res.json({ success: true, summary: result[0], byShop: shopStats });
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

  // 优雅关闭（加 try-catch 防止 shutdown 报错导致崩溃循环）
  process.on('SIGTERM', async () => {
    try { await scheduler.shutdown(); } catch(e) { console.error('[Shutdown] SIGTERM error:', e.message); }
  });

  process.on('SIGINT', async () => {
    try { await scheduler.shutdown(); } catch(e) { console.error('[Shutdown] SIGINT error:', e.message); }
  });

  return router;
};
