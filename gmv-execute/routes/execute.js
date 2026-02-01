/**
 * 执行中心 API 路由
 * /api/execute/*
 */
const express = require('express');
const { getZiNiaoService } = require('../services/ziniao');

// 操作类型定义
const ACTION_TYPES = {
  adjust_budget: { name: '调整广告预算', icon: '💰', fields: ['campaign_id', 'campaign_name', 'new_budget', 'budget_type'] },
  toggle_ad: { name: '开/关广告', icon: '🔘', fields: ['campaign_id', 'campaign_name', 'enable'] },
  update_title: { name: '修改商品标题', icon: '✏️', fields: ['product_id', 'product_name', 'new_title'] },
  update_price: { name: '修改商品价格', icon: '💵', fields: ['product_id', 'product_name', 'new_price'] },
};

module.exports = function(pool, tokenStore) {
  const router = express.Router();

  // ==================== 中间件：验证管理员权限 ====================
  function verifyAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录' });
    }
    
    const token = authHeader.split(' ')[1];
    const user = tokenStore ? tokenStore.get(token) : null;
    
    if (!user) {
      return res.status(401).json({ error: 'Token 无效' });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    req.user = user;
    next();
  }

  // ==================== 店铺管理 API ====================
  
  /**
   * 获取店铺列表
   */
  router.get('/shops', verifyAdmin, async (req, res) => {
    try {
      const [shops] = await pool.query(
        `SELECT id, name, platform, site, browser_id, browser_name, status, 
                last_connected_at, created_at 
         FROM shops ORDER BY created_at DESC`
      );
      res.json({ success: true, shops });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 添加店铺
   */
  router.post('/shops', verifyAdmin, async (req, res) => {
    try {
      const { name, platform, site, browser_id, browser_name, config } = req.body;
      
      if (!name || !browser_id) {
        return res.json({ success: false, error: '店铺名称和浏览器ID必填' });
      }

      const [existing] = await pool.query(
        'SELECT id FROM shops WHERE browser_id = ?',
        [browser_id]
      );
      
      if (existing.length > 0) {
        return res.json({ success: false, error: '该浏览器ID已绑定' });
      }

      const [result] = await pool.query(
        `INSERT INTO shops (name, platform, site, browser_id, browser_name, config)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, platform || 'shopee', site || 'id', browser_id, browser_name, JSON.stringify(config || {})]
      );

      res.json({ success: true, id: result.insertId });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 更新店铺
   */
  router.put('/shops/:id', verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, platform, site, browser_id, browser_name, status, config } = req.body;

      await pool.query(
        `UPDATE shops SET name = ?, platform = ?, site = ?, browser_id = ?, 
         browser_name = ?, status = ?, config = ? WHERE id = ?`,
        [name, platform, site, browser_id, browser_name, status, JSON.stringify(config || {}), id]
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 删除店铺
   */
  router.delete('/shops/:id', verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [tasks] = await pool.query(
        `SELECT COUNT(*) as count FROM execution_tasks 
         WHERE shop_id = ? AND status IN ('queued', 'running')`,
        [id]
      );
      
      if (tasks[0].count > 0) {
        return res.json({ success: false, error: '该店铺有未完成的任务，无法删除' });
      }

      await pool.query('DELETE FROM shops WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 从紫鸟同步店铺列表
   */
  router.post('/shops/sync-from-ziniao', verifyAdmin, async (req, res) => {
    try {
      const ziniao = getZiNiaoService();
      
      if (!ziniao.isRunning) {
        const started = await ziniao.startClient();
        if (!started) {
          return res.json({ success: false, error: '紫鸟客户端启动失败' });
        }
      }

      const browsers = await ziniao.getBrowserList();
      
      if (browsers.length === 0) {
        return res.json({ success: true, synced: 0, message: '紫鸟中没有店铺' });
      }

      let synced = 0;
      for (const browser of browsers) {
        const [existing] = await pool.query(
          'SELECT id FROM shops WHERE browser_id = ?',
          [browser.browserId]
        );

        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO shops (name, platform, site, browser_id, browser_name)
             VALUES (?, ?, ?, ?, ?)`,
            [
              browser.browserName,
              browser.platformName || 'shopee',
              browser.siteId || 'id',
              browser.browserId,
              browser.browserName
            ]
          );
          synced++;
        } else {
          await pool.query(
            'UPDATE shops SET browser_name = ? WHERE browser_id = ?',
            [browser.browserName, browser.browserId]
          );
        }
      }

      res.json({ success: true, synced, total: browsers.length });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 测试店铺连接
   */
  router.post('/shops/:id/test', verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [shops] = await pool.query('SELECT * FROM shops WHERE id = ?', [id]);
      if (shops.length === 0) {
        return res.json({ success: false, error: '店铺不存在' });
      }

      const shop = shops[0];
      const ziniao = getZiNiaoService();

      const browserInfo = await ziniao.ensureBrowser(shop.browser_id);

      await pool.query(
        'UPDATE shops SET last_connected_at = NOW(), status = "active" WHERE id = ?',
        [id]
      );

      res.json({ 
        success: true, 
        browserInfo: {
          debuggingPort: browserInfo.debuggingPort,
          coreVersion: browserInfo.coreVersion,
        }
      });
    } catch (err) {
      await pool.query(
        'UPDATE shops SET status = "error" WHERE id = ?',
        [req.params.id]
      ).catch(() => {});
      
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==================== 任务管理 API ====================

  /**
   * 获取操作类型列表
   */
  router.get('/action-types', verifyAdmin, (req, res) => {
    const types = Object.entries(ACTION_TYPES).map(([key, value]) => ({
      action: key,
      ...value,
    }));
    res.json({ success: true, types });
  });

  /**
   * 创建执行任务（核心接口 - 桥）
   * 
   * 这个接口是连接 AI 决策和执行的桥梁
   * 可以被前端手动调用，也可以被 AI 决策模块调用
   */
  router.post('/command', verifyAdmin, async (req, res) => {
    try {
      const { shop_id, action, payload, source = 'manual', source_ref, priority = 5 } = req.body;

      if (!shop_id) {
        return res.json({ success: false, error: '缺少店铺ID' });
      }

      if (!action || !ACTION_TYPES[action]) {
        return res.json({ success: false, error: `无效的操作类型: ${action}` });
      }

      if (!payload || typeof payload !== 'object') {
        return res.json({ success: false, error: '缺少操作参数' });
      }

      const [shops] = await pool.query('SELECT id, name FROM shops WHERE id = ?', [shop_id]);
      if (shops.length === 0) {
        return res.json({ success: false, error: '店铺不存在' });
      }

      // 生成任务编号
      const taskNo = `TASK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const [result] = await pool.query(
        `INSERT INTO execution_tasks 
         (task_no, shop_id, action, action_name, payload, priority, source, source_ref, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          taskNo,
          shop_id,
          action,
          ACTION_TYPES[action].name,
          JSON.stringify(payload),
          priority,
          source,
          source_ref,
          req.user?.id || null
        ]
      );

      res.json({ 
        success: true, 
        task_id: result.insertId,
        task_no: taskNo,
        status: 'queued'
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 获取任务列表
   */
  router.get('/tasks', verifyAdmin, async (req, res) => {
    try {
      const { shop_id, status, limit = 50, offset = 0 } = req.query;

      let sql = `
        SELECT t.*, s.name as shop_name, u.name as creator_name
        FROM execution_tasks t
        LEFT JOIN shops s ON t.shop_id = s.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE 1=1
      `;
      const params = [];

      if (shop_id) {
        sql += ' AND t.shop_id = ?';
        params.push(shop_id);
      }

      if (status) {
        sql += ' AND t.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [tasks] = await pool.query(sql, params);

      // 获取总数
      let countSql = 'SELECT COUNT(*) as total FROM execution_tasks WHERE 1=1';
      const countParams = [];
      if (shop_id) {
        countSql += ' AND shop_id = ?';
        countParams.push(shop_id);
      }
      if (status) {
        countSql += ' AND status = ?';
        countParams.push(status);
      }
      const [countResult] = await pool.query(countSql, countParams);

      res.json({ 
        success: true, 
        tasks: tasks.map(t => ({
          ...t,
          payload: typeof t.payload === 'string' ? JSON.parse(t.payload) : t.payload,
          result: t.result ? (typeof t.result === 'string' ? JSON.parse(t.result) : t.result) : null,
        })),
        total: countResult[0].total 
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 获取任务详情
   */
  router.get('/tasks/:id', verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      const [tasks] = await pool.query(
        `SELECT t.*, s.name as shop_name, u.name as creator_name
         FROM execution_tasks t
         LEFT JOIN shops s ON t.shop_id = s.id
         LEFT JOIN users u ON t.created_by = u.id
         WHERE t.id = ?`,
        [id]
      );

      if (tasks.length === 0) {
        return res.status(404).json({ success: false, error: '任务不存在' });
      }

      const task = tasks[0];

      // 获取执行日志
      const [logs] = await pool.query(
        'SELECT * FROM execution_logs WHERE task_id = ? ORDER BY step',
        [id]
      );

      res.json({ 
        success: true, 
        task: {
          ...task,
          payload: typeof task.payload === 'string' ? JSON.parse(task.payload) : task.payload,
          result: task.result ? (typeof task.result === 'string' ? JSON.parse(task.result) : task.result) : null,
        },
        logs 
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 取消任务
   */
  router.post('/tasks/:id/cancel', verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      const [tasks] = await pool.query(
        'SELECT status FROM execution_tasks WHERE id = ?',
        [id]
      );

      if (tasks.length === 0) {
        return res.status(404).json({ success: false, error: '任务不存在' });
      }

      if (tasks[0].status !== 'queued') {
        return res.json({ success: false, error: '只能取消排队中的任务' });
      }

      await pool.query(
        'UPDATE execution_tasks SET status = "cancelled" WHERE id = ?',
        [id]
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 重试任务
   */
  router.post('/tasks/:id/retry', verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      const [tasks] = await pool.query(
        'SELECT * FROM execution_tasks WHERE id = ?',
        [id]
      );

      if (tasks.length === 0) {
        return res.status(404).json({ success: false, error: '任务不存在' });
      }

      const task = tasks[0];

      if (task.status !== 'failed') {
        return res.json({ success: false, error: '只能重试失败的任务' });
      }

      // 创建新任务
      const taskNo = `TASK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const [result] = await pool.query(
        `INSERT INTO execution_tasks 
         (task_no, shop_id, action, action_name, payload, priority, source, source_ref, created_by)
         VALUES (?, ?, ?, ?, ?, ?, 'retry', ?, ?)`,
        [
          taskNo,
          task.shop_id,
          task.action,
          task.action_name,
          task.payload,
          task.priority,
          task.id.toString(),
          req.user?.id || null
        ]
      );

      res.json({ 
        success: true, 
        task_id: result.insertId,
        task_no: taskNo
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==================== 统计 API ====================

  /**
   * 获取执行统计
   */
  router.get('/stats', verifyAdmin, async (req, res) => {
    try {
      const [stats] = await pool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
          SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM execution_tasks
      `);

      const [todayStats] = await pool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM execution_tasks
        WHERE DATE(created_at) = CURDATE()
      `);

      res.json({ 
        success: true, 
        stats: stats[0],
        today: todayStats[0]
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==================== Worker 状态 API ====================

  /**
   * 获取 Worker 状态
   */
  router.get('/worker/status', verifyAdmin, async (req, res) => {
    try {
      const ziniao = getZiNiaoService();
      const isRunning = await ziniao.healthCheck();

      res.json({ 
        success: true, 
        worker: {
          ziniao_running: isRunning,
          active_browsers: ziniao.activeBrowsers.size,
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
