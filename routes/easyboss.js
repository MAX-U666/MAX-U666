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

  // 优雅关闭
  process.on('SIGTERM', async () => {
    await scheduler.shutdown();
  });

  process.on('SIGINT', async () => {
    await scheduler.shutdown();
  });

  return router;
};
