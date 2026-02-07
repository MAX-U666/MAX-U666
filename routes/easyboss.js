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
  // 用户店铺权限辅助
  // =============================================
  
  /**
   * 从请求中解析用户（轻量，不强制）
   * 读取 Bearer token，查 api.js 共享的 tokens Map
   * 如果没有 token 或无效则 req.shopUser = null
   */
  function parseUser(req) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
      const token = authHeader.split(' ')[1];
      // 通过 pool 查 users 表中对应 token (这里直接查 user_shops)
      return token;
    } catch { return null; }
  }

  /**
   * 获取当前用户可访问的 shop_id 列表
   * 返回 null 表示不限制（admin），返回数组表示限定范围
   */
  async function getAllowedShopIds(req) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) return null; // 无token不过滤（兼容旧行为）
      
      // 调用 verify-token 逻辑：查内存中的 token map
      // 由于 api.js 的 tokens 是内存 Map，easyboss 路由无法直接访问
      // 因此走数据库查询：通过请求头 X-User-Id 和 X-User-Role（由前端传递）
      const userId = req.headers['x-user-id'];
      const userRole = req.headers['x-user-role'];
      
      if (!userId) return null; // 无用户信息不过滤
      if (userRole === 'admin') return null; // 管理员不限
      
      const [rows] = await pool.query('SELECT shop_id FROM user_shops WHERE user_id = ?', [parseInt(userId)]);
      if (rows.length === 0) return []; // 无授权返回空数组（啥也看不到）
      return rows.map(r => r.shop_id);
    } catch (e) {
      console.error('[getAllowedShopIds] error:', e.message);
      return null;
    }
  }

  /**
   * 给 SQL WHERE 子句添加店铺过滤条件
   * @param {string} where - 现有 WHERE 条件
   * @param {Array} params - 现有参数
   * @param {Array|null} shopIds - 允许的店铺ID列表，null 表示不限
   * @param {string} field - 店铺字段名（默认 shop_id）
   */
  function addShopFilter(where, params, shopIds, field = 'shop_id') {
    if (!shopIds) return { where, params }; // 不限制
    if (shopIds.length === 0) {
      return { where: where + ` AND 1=0`, params }; // 无权限
    }
    const placeholders = shopIds.map(() => '?').join(',');
    return {
      where: where + ` AND ${field} IN (${placeholders})`,
      params: [...params, ...shopIds]
    };
  }

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
  /**
   * GET /api/easyboss/shops
   * 获取店铺映射表
   */
  router.get('/shops', async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT shop_id, shop_name FROM eb_shops ORDER BY shop_name`
      );
      // 构建 map 供前端使用
      const shopMap = {};
      rows.forEach(r => { shopMap[r.shop_id] = r.shop_name; });
      res.json({ success: true, data: rows, shopMap });
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

      // 保存cookie到数据库
      await pool.query(
        `INSERT INTO eb_config (config_key, config_value) VALUES ('easyboss_cookie', ?)
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
        [cookie]
      );

      // 同时写入Cookie文件（http-auth.js优先读文件）
      const fs = require('fs');
      const path = require('path');
      const cookieFile = path.join(__dirname, '../services/easyboss/.easyboss_cookie');
      fs.writeFileSync(cookieFile, cookie, 'utf-8');
      console.log(`[set-cookie] Cookie已写入文件和数据库 (${cookie.length}字符)`);

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
        where += ' AND shop_id = ?';
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

      // 店铺权限过滤
      const allowedShops = await getAllowedShopIds(req);
      const filtered = addShopFilter(where, params, allowedShops);
      where = filtered.where;
      const finalParams = filtered.params;

      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM eb_orders WHERE ${where}`, finalParams
      );
      const total = countResult[0].total;

      const [orders] = await pool.query(
        `SELECT * FROM eb_orders WHERE ${where} ORDER BY gmt_order_start DESC LIMIT ? OFFSET ?`,
        [...finalParams, pageSize, offset]
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

      // 店铺权限过滤
      const allowedShops = await getAllowedShopIds(req);
      const f = addShopFilter(where, params, allowedShops);
      where = f.where;
      const finalParams = f.params;

      const [result] = await pool.query(`
        SELECT
          COUNT(*) as total_orders,
          SUM(CASE WHEN platform_order_status != 'CANCELLED' THEN pay_amount ELSE 0 END) as total_gmv,
          SUM(order_profit) as total_profit,
          COUNT(DISTINCT shop_name) as shop_count
        FROM eb_orders WHERE ${where}
      `, finalParams);

      const summary = result[0];
      const profitMargin = summary.total_gmv > 0
        ? ((summary.total_profit / summary.total_gmv) * 100).toFixed(1) + '%'
        : '0%';

      // 按店铺统计
      const [shopStats] = await pool.query(`
        SELECT
          o.shop_id,
          COALESCE(MAX(s.shop_name), MAX(o.shop_name), o.shop_id) as shop_name,
          COUNT(*) as count,
          SUM(CASE WHEN o.platform_order_status != 'CANCELLED' THEN o.pay_amount ELSE 0 END) as total_pay
        FROM eb_orders o
        LEFT JOIN eb_shops s ON s.shop_id = o.shop_id
        WHERE ${where.replace(/shop_id/g, 'o.shop_id').replace(/gmt_order_start/g, 'o.gmt_order_start')}
        GROUP BY o.shop_id
        ORDER BY count DESC
      `, finalParams);

      // 按状态统计
      const [statusStats] = await pool.query(`
        SELECT
          app_package_tab as status,
          COUNT(*) as count
        FROM eb_orders WHERE ${where}
        GROUP BY app_package_tab
        ORDER BY count DESC
      `, finalParams);

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
      const hasDateFilter = req.query.dateFrom || req.query.dateTo;

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
      } else if (req.query.matched === 'false') {
        where += ' AND (platform_item_id IS NULL OR platform_item_id = "")';
      }
      if (req.query.keyword) {
        where += ' AND ad_name LIKE ?';
        params.push(`%${req.query.keyword}%`);
      }

      // 店铺权限过滤
      const allowedShops = await getAllowedShopIds(req);
      const sf = addShopFilter(where, params, allowedShops);
      where = sf.where;
      params.length = 0; params.push(...sf.params);

      // 日期筛选 - 关联eb_ad_daily
      let dailyWhere = '';
      const dailyParams = [];
      if (req.query.dateFrom) {
        dailyWhere += ' AND d.date >= ?';
        dailyParams.push(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        dailyWhere += ' AND d.date <= ?';
        dailyParams.push(req.query.dateTo);
      }

      if (hasDateFilter) {
        // 有日期筛选：JOIN daily聚合该时段数据
        const allParams = [...params, ...dailyParams, pageSize, offset];
        const w = where.replace(/shop_id/g, 'a.shop_id').replace(/campaign_status/g, 'a.campaign_status').replace(/platform_item_id/g, 'a.platform_item_id').replace(/ad_name/g, 'a.ad_name');

        const [countResult] = await pool.query(`
          SELECT COUNT(DISTINCT a.id) as total 
          FROM eb_ad_campaigns a
          INNER JOIN eb_ad_daily d ON d.platform_campaign_id = a.platform_campaign_id AND d.shop_id = a.shop_id
          WHERE ${w} ${dailyWhere}
        `, [...params, ...dailyParams]);
        const total = countResult[0].total;

        const [campaigns] = await pool.query(`
          SELECT a.id, a.shopee_ads_campaign_id, a.shop_id, a.platform_campaign_id, a.platform_item_id,
                 a.ad_name, a.ad_type, a.region, a.bidding_method, a.campaign_placement,
                 a.campaign_status, a.campaign_budget, a.currency,
                 s.shop_name,
                 SUM(d.expense) as expense,
                 SUM(d.impression) as impression,
                 SUM(d.clicks) as clicks,
                 CASE WHEN SUM(d.impression) > 0 THEN ROUND(SUM(d.clicks)/SUM(d.impression)*100, 2) ELSE 0 END as ctr,
                 SUM(d.broad_gmv) as broad_gmv,
                 SUM(d.broad_order) as broad_order,
                 CASE WHEN SUM(d.expense) > 0 THEN ROUND(SUM(d.broad_gmv)/SUM(d.expense), 2) ELSE 0 END as broad_roi,
                 SUM(d.direct_gmv) as direct_gmv,
                 SUM(d.direct_order) as direct_order,
                 CASE WHEN SUM(d.expense) > 0 THEN ROUND(SUM(d.direct_gmv)/SUM(d.expense), 2) ELSE 0 END as direct_roi
          FROM eb_ad_campaigns a
          INNER JOIN eb_ad_daily d ON d.platform_campaign_id = a.platform_campaign_id AND d.shop_id = a.shop_id
          LEFT JOIN eb_shops s ON s.shop_id = a.shop_id
          WHERE ${w} ${dailyWhere}
          GROUP BY a.id
          ORDER BY expense DESC
          LIMIT ? OFFSET ?
        `, allParams);

        res.json({ success: true, campaigns, total, page, pageSize });
      } else {
        // 无日期筛选：原逻辑
        const [countResult] = await pool.query(
          `SELECT COUNT(*) as total FROM eb_ad_campaigns WHERE ${where}`, params
        );
        const total = countResult[0].total;
        const w = where.replace(/shop_id/g, 'a.shop_id').replace(/campaign_status/g, 'a.campaign_status').replace(/platform_item_id/g, 'a.platform_item_id').replace(/ad_name/g, 'a.ad_name');
        const [campaigns] = await pool.query(
          `SELECT a.*, s.shop_name FROM eb_ad_campaigns a 
           LEFT JOIN eb_shops s ON s.shop_id = a.shop_id
           WHERE ${w} ORDER BY a.expense DESC LIMIT ? OFFSET ?`,
          [...params, pageSize, offset]
        );
        res.json({ success: true, campaigns, total, page, pageSize });
      }
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
        SELECT a.shop_id, s.shop_name, COUNT(*) as campaign_count,
          SUM(a.expense) as total_expense, SUM(a.broad_gmv) as total_gmv,
          SUM(a.broad_order) as total_orders,
          CASE WHEN SUM(a.expense) > 0 THEN ROUND(SUM(a.broad_gmv)/SUM(a.expense), 2) ELSE 0 END as avg_roi
        FROM eb_ad_campaigns a
        LEFT JOIN eb_shops s ON s.shop_id = a.shop_id
        WHERE ${where.replace(/campaign_status/g, 'a.campaign_status')}
        GROUP BY a.shop_id, s.shop_name ORDER BY total_expense DESC
      `, params);

      res.json({
        success: true,
        totalCampaigns: s.total_campaigns,
        totalExpense: s.total_expense,
        totalGmv: s.total_gmv,
        totalOrders: s.total_orders,
        overallRoi,
        matchedCampaigns: s.matched_count,
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
        `SELECT *, DATE_FORMAT(date, '%Y-%m-%d') as date FROM eb_ad_daily WHERE ${where} ORDER BY date DESC LIMIT 500`,
        params
      );

      res.json({ success: true, records, count: records.length });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/easyboss/ads/clean
   * 清理超过N个月的广告数据
   * Body: { months: 3 }
   */
  router.post('/ads/clean', async (req, res) => {
    try {
      const months = parseInt(req.body?.months) || 3;
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      const cutoffStr = cutoff.toISOString().split('T')[0];

      const [dailyResult] = await pool.query(
        'DELETE FROM eb_ad_daily WHERE date < ?', [cutoffStr]
      );

      res.json({
        success: true,
        cutoffDate: cutoffStr,
        deletedDaily: dailyResult.affectedRows,
      });
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

      // 店铺权限过滤
      const allowedShops = await getAllowedShopIds(req);
      const sf = addShopFilter(where, params, allowedShops);
      where = sf.where;
      params.length = 0; params.push(...sf.params);

      const sortField = req.query.sortBy === 'sell' ? 'sell_cnt' :
                        req.query.sortBy === 'stock' ? 'stock' :
                        req.query.sortBy === 'price' ? 'sale_price' :
                        req.query.sortBy === 'rating' ? 'rating_star' : 'sell_cnt';

      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM eb_products WHERE ${where}`, params
      );

      const [products] = await pool.query(
        `SELECT p.*, s.shop_name FROM eb_products p
         LEFT JOIN eb_shops s ON s.shop_id = p.shop_id
         WHERE ${where.replace(/shop_id/g, 'p.shop_id').replace(/status/g, 'p.status').replace(/title/g, 'p.title')} 
         ORDER BY p.${sortField} DESC LIMIT ? OFFSET ?`,
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
        SELECT p.shop_id, s.shop_name, COUNT(*) as products, SUM(p.sell_cnt) as sold, SUM(p.stock) as stock
        FROM eb_products p
        LEFT JOIN eb_shops s ON s.shop_id = p.shop_id
        WHERE p.status = 'onsale'
        GROUP BY p.shop_id, s.shop_name ORDER BY sold DESC
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
        `SELECT p.*, s.shop_name FROM eb_products p
         LEFT JOIN eb_shops s ON s.shop_id = p.shop_id
         WHERE p.platform_item_id = ?`, [itemId]
      );
      if (products.length === 0) {
        return res.status(404).json({ success: false, error: '商品不存在' });
      }

      // 关联广告
      const [ads] = await pool.query(
        `SELECT a.*, s.shop_name FROM eb_ad_campaigns a
         LEFT JOIN eb_shops s ON s.shop_id = a.shop_id
         WHERE a.platform_item_id = ?`, [itemId]
      );

      // 关联订单统计
      const [orderStats] = await pool.query(
        `SELECT COUNT(DISTINCT i.op_order_id) as order_count, 
                SUM(i.discounted_price * i.quantity) as total_gmv,
                SUM(i.quantity) as total_qty
         FROM eb_order_items i
         WHERE i.platform_item_id = ?`, [itemId]
      );

      // 最近订单明细
      const [recentOrders] = await pool.query(
        `SELECT o.platform_order_sn, o.shop_name, o.gmt_order_start, 
                o.pay_amount, o.app_package_tab as status,
                i.quantity, i.discounted_price
         FROM eb_order_items i
         JOIN eb_orders o ON o.op_order_package_id = i.op_order_package_id
         WHERE i.platform_item_id = ?
         ORDER BY o.gmt_order_start DESC LIMIT 20`, [itemId]
      );

      res.json({
        success: true,
        product: products[0],
        ads,
        orderStats: orderStats[0],
        recentOrders,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =============================================
  // 企业微信通知中转 + 同步日志
  // =============================================

  const https = require('https');

  /**
   * POST /api/easyboss/notify
   * 企业微信消息中转（给daily-sync.js用）
   */
  router.post('/notify', async (req, res) => {
    try {
      const { content } = req.body || {};
      if (!content) return res.status(400).json({ success: false, error: '缺少content' });

      const webhookUrl = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=f74c9925-3967-4f21-b1d7-fae4865565cf';
      const url = new URL(webhookUrl);
      const data = JSON.stringify({ msgtype: 'markdown', markdown: { content } });

      const result = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: url.hostname, port: 443,
          path: url.pathname + url.search,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
          timeout: 10000,
        }, (res) => {
          let body = '';
          res.on('data', d => body += d);
          res.on('end', () => {
            try { resolve(JSON.parse(body)); } catch { resolve(body); }
          });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.write(data);
        req.end();
      });

      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/sync/logs
   * 查看同步日志
   */
  router.get('/sync/logs', async (req, res) => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS eb_sync_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sync_type VARCHAR(20) DEFAULT 'daily',
          status VARCHAR(20),
          orders_result JSON,
          ads_result JSON,
          products_result JSON,
          errors TEXT,
          duration VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const [logs] = await pool.query(
        'SELECT * FROM eb_sync_logs ORDER BY created_at DESC LIMIT 30'
      );
      res.json({ success: true, logs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =============================================
  // 数据分析仪表盘
  // =============================================

  /**
   * GET /api/easyboss/analytics/overview
   * 综合概览：今日/昨日/本周/本月数据对比
   */
  router.get('/analytics/overview', async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

      // 订单概览
      const [orderStats] = await pool.query(`
        SELECT
          SUM(CASE WHEN DATE(gmt_order_start) = ? THEN 1 ELSE 0 END) as today_orders,
          SUM(CASE WHEN DATE(gmt_order_start) = ? THEN pay_amount ELSE 0 END) as today_gmv,
          SUM(CASE WHEN DATE(gmt_order_start) = ? THEN order_profit ELSE 0 END) as today_profit,
          SUM(CASE WHEN DATE(gmt_order_start) = ? THEN 1 ELSE 0 END) as yesterday_orders,
          SUM(CASE WHEN DATE(gmt_order_start) = ? THEN pay_amount ELSE 0 END) as yesterday_gmv,
          SUM(CASE WHEN DATE(gmt_order_start) = ? THEN order_profit ELSE 0 END) as yesterday_profit,
          SUM(CASE WHEN DATE(gmt_order_start) >= ? THEN 1 ELSE 0 END) as week_orders,
          SUM(CASE WHEN DATE(gmt_order_start) >= ? THEN pay_amount ELSE 0 END) as week_gmv,
          SUM(CASE WHEN DATE(gmt_order_start) >= ? THEN order_profit ELSE 0 END) as week_profit
        FROM eb_orders WHERE platform_order_status != 'CANCELLED'
      `, [today, today, today, yesterday, yesterday, yesterday, weekAgo, weekAgo, weekAgo]);

      // 广告概览
      const [adStats] = await pool.query(`
        SELECT
          SUM(CASE WHEN date = ? THEN expense ELSE 0 END) as today_cost,
          SUM(CASE WHEN date = ? THEN broad_gmv ELSE 0 END) as today_ad_gmv,
          SUM(CASE WHEN date = ? THEN broad_order ELSE 0 END) as today_ad_orders,
          SUM(CASE WHEN date = ? THEN expense ELSE 0 END) as yesterday_cost,
          SUM(CASE WHEN date = ? THEN broad_gmv ELSE 0 END) as yesterday_ad_gmv,
          SUM(CASE WHEN date >= ? THEN expense ELSE 0 END) as week_cost,
          SUM(CASE WHEN date >= ? THEN broad_gmv ELSE 0 END) as week_ad_gmv,
          SUM(CASE WHEN date >= ? THEN broad_order ELSE 0 END) as week_ad_orders
        FROM eb_ad_daily
      `, [today, today, today, yesterday, yesterday, weekAgo, weekAgo, weekAgo]);

      const o = orderStats[0];
      const a = adStats[0];

      res.json({
        success: true,
        today: {
          orders: o.today_orders || 0, gmv: o.today_gmv || 0, profit: o.today_profit || 0,
          adCost: a.today_cost || 0, adGmv: a.today_ad_gmv || 0, adOrders: a.today_ad_orders || 0,
          roi: a.today_cost > 0 ? (a.today_ad_gmv / a.today_cost).toFixed(2) : 0,
        },
        yesterday: {
          orders: o.yesterday_orders || 0, gmv: o.yesterday_gmv || 0, profit: o.yesterday_profit || 0,
          adCost: a.yesterday_cost || 0, adGmv: a.yesterday_ad_gmv || 0,
          roi: a.yesterday_cost > 0 ? (a.yesterday_ad_gmv / a.yesterday_cost).toFixed(2) : 0,
        },
        week: {
          orders: o.week_orders || 0, gmv: o.week_gmv || 0, profit: o.week_profit || 0,
          adCost: a.week_cost || 0, adGmv: a.week_ad_gmv || 0, adOrders: a.week_ad_orders || 0,
          roi: a.week_cost > 0 ? (a.week_ad_gmv / a.week_cost).toFixed(2) : 0,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/analytics/trend?days=14
   * 每日趋势：订单数/GMV/利润/广告花费/广告ROI
   */
  router.get('/analytics/trend', async (req, res) => {
    try {
      const days = Math.min(parseInt(req.query.days) || 14, 90);
      const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

      const [orderTrend] = await pool.query(`
        SELECT DATE_FORMAT(DATE(gmt_order_start), '%Y-%m-%d') as date,
          COUNT(*) as orders,
          SUM(pay_amount) as gmv,
          SUM(order_profit) as profit
        FROM eb_orders
        WHERE DATE(gmt_order_start) >= ? AND platform_order_status != 'CANCELLED'
        GROUP BY DATE(gmt_order_start)
        ORDER BY date
      `, [startDate]);

      const [adTrend] = await pool.query(`
        SELECT DATE_FORMAT(date, '%Y-%m-%d') as date,
          SUM(expense) as ad_cost,
          SUM(broad_gmv) as ad_gmv,
          SUM(broad_order) as ad_orders,
          CASE WHEN SUM(expense)>0 THEN ROUND(SUM(broad_gmv)/SUM(expense),2) ELSE 0 END as roi
        FROM eb_ad_daily
        WHERE date >= ?
        GROUP BY date
        ORDER BY date
      `, [startDate]);

      // 合并订单和广告趋势
      const adMap = {};
      adTrend.forEach(a => { adMap[a.date] = a; });

      const trend = orderTrend.map(o => {
        const d = o.date;
        const a = adMap[d] || {};
        return {
          date: d,
          orders: o.orders, gmv: parseFloat(o.gmv) || 0, profit: parseFloat(o.profit) || 0,
          adCost: parseFloat(a.ad_cost) || 0, adGmv: parseFloat(a.ad_gmv) || 0,
          adOrders: a.ad_orders || 0, roi: parseFloat(a.roi) || 0,
        };
      });

      res.json({ success: true, trend });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/analytics/top-products?limit=10&days=30
   * 商品利润排行 + 广告投产分析
   */
  router.get('/analytics/top-products', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 50);
      const days = Math.min(parseInt(req.query.days) || 30, 90);
      const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

      const [products] = await pool.query(`
        SELECT
          p.platform_item_id, p.item_name, p.shop_id, p.sale_price, p.sell_cnt,
          COALESCE(s.shop_name, p.shop_id) as shop_name,
          COUNT(o.id) as order_count,
          SUM(o.pay_amount) as total_gmv,
          SUM(o.order_profit) as total_profit,
          COALESCE(ad.total_cost, 0) as ad_cost,
          COALESCE(ad.total_ad_gmv, 0) as ad_gmv,
          COALESCE(ad.total_ad_orders, 0) as ad_orders,
          CASE WHEN COALESCE(ad.total_cost,0) > 0
            THEN ROUND(COALESCE(ad.total_ad_gmv,0) / ad.total_cost, 2) ELSE 0 END as ad_roi,
          CASE WHEN COALESCE(ad.total_cost,0) > 0
            THEN ROUND((SUM(o.order_profit) - COALESCE(ad.total_cost,0)), 0) ELSE SUM(o.order_profit) END as net_profit
        FROM eb_products p
        INNER JOIN eb_orders o ON o.platform_item_id = p.platform_item_id AND o.shop_id = p.shop_id
          AND DATE(o.gmt_order_start) >= ? AND o.platform_order_status != 'CANCELLED'
        LEFT JOIN eb_shops s ON s.shop_id = p.shop_id
        LEFT JOIN (
          SELECT platform_item_id, d.shop_id,
            SUM(expense) as total_cost, SUM(broad_gmv) as total_ad_gmv, SUM(broad_order) as total_ad_orders
          FROM eb_ad_daily d
          INNER JOIN eb_ad_campaigns c ON c.platform_campaign_id = d.platform_campaign_id AND c.shop_id = d.shop_id
          WHERE d.date >= ?
          GROUP BY c.platform_item_id, d.shop_id
        ) ad ON ad.platform_item_id = p.platform_item_id AND ad.shop_id = p.shop_id
        GROUP BY p.platform_item_id, p.shop_id
        ORDER BY total_profit DESC
        LIMIT ?
      `, [startDate, startDate, limit]);

      res.json({ success: true, products });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/analytics/ad-decisions
   * AI广告决策建议：哪些该加预算/减预算/暂停
   */
  router.get('/analytics/ad-decisions', async (req, res) => {
    try {
      const days = Math.min(parseInt(req.query.days) || 7, 30);
      const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

      const [ads] = await pool.query(`
        SELECT
          c.platform_campaign_id, c.ad_name, c.shop_id, c.campaign_status, c.campaign_budget,
          COALESCE(s.shop_name, c.shop_id) as shop_name, c.platform_item_id,
          SUM(d.expense) as cost_period,
          SUM(d.broad_gmv) as gmv_period,
          SUM(d.broad_order) as orders_period,
          SUM(d.impression) as impressions,
          SUM(d.clicks) as clicks,
          CASE WHEN SUM(d.expense)>0 THEN ROUND(SUM(d.broad_gmv)/SUM(d.expense),2) ELSE 0 END as roi,
          CASE WHEN SUM(d.impression)>0 THEN ROUND(SUM(d.clicks)/SUM(d.impression)*100,2) ELSE 0 END as ctr
        FROM eb_ad_campaigns c
        INNER JOIN eb_ad_daily d ON d.platform_campaign_id = c.platform_campaign_id AND d.shop_id = c.shop_id
        LEFT JOIN eb_shops s ON s.shop_id = c.shop_id
        WHERE d.date >= ? AND c.campaign_status = 'ongoing'
        GROUP BY c.platform_campaign_id, c.shop_id
        HAVING cost_period > 0
        ORDER BY cost_period DESC
      `, [startDate]);

      // 生成决策建议
      const decisions = ads.map(ad => {
        const roi = parseFloat(ad.roi) || 0;
        const ctr = parseFloat(ad.ctr) || 0;
        const cost = parseFloat(ad.cost_period) || 0;
        const orders = ad.orders_period || 0;

        let action, reason, urgency;
        if (roi >= 5) {
          action = '🟢 加预算'; reason = `ROI ${roi} 表现优秀，加大投放`;  urgency = 'high';
        } else if (roi >= 3) {
          action = '🟡 维持'; reason = `ROI ${roi} 表现良好，维持当前投放`; urgency = 'low';
        } else if (roi >= 1.5) {
          action = '🟠 观察'; reason = `ROI ${roi} 偏低，优化素材或出价`; urgency = 'medium';
        } else if (orders === 0 && cost > 100000) {
          action = '🔴 暂停'; reason = `花费 ${(cost/1000).toFixed(0)}K 但0订单，建议暂停`; urgency = 'high';
        } else if (roi > 0) {
          action = '🔴 减预算'; reason = `ROI ${roi} 亏损，降低预算或暂停`; urgency = 'high';
        } else {
          action = '🔴 暂停'; reason = `无GMV产出，建议暂停`; urgency = 'high';
        }

        return { ...ad, action, reason, urgency };
      });

      const summary = {
        increase: decisions.filter(d => d.action.includes('加预算')).length,
        maintain: decisions.filter(d => d.action.includes('维持')).length,
        observe: decisions.filter(d => d.action.includes('观察')).length,
        decrease: decisions.filter(d => d.action.includes('减预算')).length,
        pause: decisions.filter(d => d.action.includes('暂停')).length,
      };

      res.json({ success: true, decisions, summary, period: `${days}天` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =============================================
  // 执行中心 - 决策执行记录
  // =============================================

  // 建表（幂等）
  const initExecutionLogs = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ad_execution_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        platform_campaign_id VARCHAR(50) NOT NULL,
        shop_id VARCHAR(50) NOT NULL,
        ad_name VARCHAR(255),
        action_type ENUM('increase', 'maintain', 'observe', 'decrease', 'pause') NOT NULL,
        ai_reason TEXT,
        execution_status ENUM('pending', 'executed', 'ignored') DEFAULT 'pending',
        executor_id INT,
        executor_name VARCHAR(50),
        executed_at TIMESTAMP NULL,
        roi_before DECIMAL(10,2),
        cost_before DECIMAL(15,2),
        gmv_before DECIMAL(15,2),
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_campaign (platform_campaign_id, shop_id),
        INDEX idx_status (execution_status),
        INDEX idx_date (created_at)
      )
    `);
  };
  initExecutionLogs().catch(e => console.error('[ad_execution_logs] init error:', e.message));

  /**
   * POST /api/easyboss/execute/log
   * 记录AI决策到执行队列
   */
  router.post('/execute/log', async (req, res) => {
    try {
      const { decisions } = req.body;
      if (!decisions || !Array.isArray(decisions) || decisions.length === 0) {
        return res.json({ success: false, error: '无决策数据' });
      }

      // 批量插入，ON DUPLICATE 更新
      let inserted = 0;
      for (const d of decisions) {
        // 检查今天是否已有记录
        const today = new Date().toISOString().split('T')[0];
        const [existing] = await pool.query(
          `SELECT id FROM ad_execution_logs 
           WHERE platform_campaign_id = ? AND shop_id = ? AND DATE(created_at) = ?`,
          [d.platform_campaign_id, d.shop_id, today]
        );
        
        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO ad_execution_logs 
             (platform_campaign_id, shop_id, ad_name, action_type, ai_reason, roi_before, cost_before, gmv_before)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              d.platform_campaign_id, d.shop_id, d.ad_name,
              d.action_type || 'maintain', d.reason,
              d.roi || 0, d.cost_period || 0, d.gmv_period || 0
            ]
          );
          inserted++;
        }
      }
      
      res.json({ success: true, inserted, total: decisions.length });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/easyboss/execute/action
   * 执行/忽略决策
   */
  router.post('/execute/action', async (req, res) => {
    try {
      const { logId, action, note } = req.body;
      // action: 'execute' | 'ignore'
      
      const userId = req.headers['x-user-id'];
      const userName = req.headers['x-user-name'] || '未知';
      
      if (!logId || !action) {
        return res.json({ success: false, error: '参数错误' });
      }

      const status = action === 'execute' ? 'executed' : 'ignored';
      await pool.query(
        `UPDATE ad_execution_logs 
         SET execution_status = ?, executor_id = ?, executor_name = ?, executed_at = NOW(), note = ?
         WHERE id = ?`,
        [status, userId, userName, note || '', logId]
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/execute/pending
   * 获取待执行的决策列表
   */
  router.get('/execute/pending', async (req, res) => {
    try {
      const allowedShops = await getAllowedShopIds(req);
      let where = "execution_status = 'pending'";
      const params = [];
      
      if (allowedShops && allowedShops.length > 0) {
        where += ` AND shop_id IN (${allowedShops.map(() => '?').join(',')})`;
        params.push(...allowedShops);
      } else if (allowedShops && allowedShops.length === 0) {
        return res.json({ success: true, logs: [] });
      }

      const [logs] = await pool.query(
        `SELECT l.*, s.shop_name 
         FROM ad_execution_logs l
         LEFT JOIN eb_shops s ON s.shop_id = l.shop_id
         WHERE ${where}
         ORDER BY l.created_at DESC`,
        params
      );

      res.json({ success: true, logs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/easyboss/execute/history
   * 获取执行历史
   */
  router.get('/execute/history', async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const allowedShops = await getAllowedShopIds(req);
      let where = 'l.created_at >= ?';
      const params = [startDate.toISOString().split('T')[0]];
      
      if (allowedShops && allowedShops.length > 0) {
        where += ` AND l.shop_id IN (${allowedShops.map(() => '?').join(',')})`;
        params.push(...allowedShops);
      } else if (allowedShops && allowedShops.length === 0) {
        return res.json({ success: true, logs: [], stats: {} });
      }

      const [logs] = await pool.query(
        `SELECT l.*, s.shop_name 
         FROM ad_execution_logs l
         LEFT JOIN eb_shops s ON s.shop_id = l.shop_id
         WHERE ${where}
         ORDER BY l.created_at DESC
         LIMIT 200`,
        params
      );

      // 统计
      const [stats] = await pool.query(
        `SELECT 
           COUNT(*) as total,
           SUM(execution_status = 'executed') as executed,
           SUM(execution_status = 'ignored') as ignored,
           SUM(execution_status = 'pending') as pending
         FROM ad_execution_logs l
         WHERE ${where}`,
        params
      );

      res.json({ success: true, logs, stats: stats[0] || {} });
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
