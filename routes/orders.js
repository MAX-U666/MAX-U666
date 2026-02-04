/**
 * EasyBoss 订单数据 API 路由
 * 挂载到 /api/easyboss/orders 下
 */

const express = require('express');
const EasyBossOrderFetcher = require('../services/easyboss/fetch-orders');

module.exports = function(pool) {
  const router = express.Router();
  const fetcher = new EasyBossOrderFetcher(pool);

  /**
   * POST /api/easyboss/orders/fetch
   * 触发订单数据拉取
   * Body: { days: 7, dateFrom: '', dateTo: '', status: 'all' }
   */
  router.post('/fetch', async (req, res) => {
    try {
      const { days, dateFrom, dateTo, status } = req.body || {};
      const result = await fetcher.run({ days, dateFrom, dateTo, status });
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/orders/list
   * 查询已入库的订单
   * Query: page, pageSize, shopId, status, dateFrom, dateTo, keyword
   */
  router.get('/list', async (req, res) => {
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
   * Query: dateFrom, dateTo, shopId
   */
  router.get('/stats', async (req, res) => {
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
  router.get('/detail/:packageId', async (req, res) => {
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
   * 拉取日志
   */
  router.get('/logs', async (req, res) => {
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

  return router;
};
