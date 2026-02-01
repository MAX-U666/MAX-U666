/**
 * 执行器核心服务
 * 负责：任务调度、执行协调、结果记录
 */
const { getZiNiaoService } = require('./ziniao');
const { createBrowserController } = require('./browser');
const { getLocators, getActionLocators } = require('./locators');

// 操作处理器
const actionHandlers = {
  adjust_budget: require('./actions/adjustBudget'),
  toggle_ad: require('./actions/toggleAd'),
  update_title: require('./actions/updateTitle'),
  update_price: require('./actions/updatePrice'),
};

class Executor {
  constructor(pool) {
    this.pool = pool;
    this.ziniao = getZiNiaoService();
    this.activeBrowsers = new Map(); // shopId -> BrowserController
    this.isRunning = false;
  }

  /**
   * 初始化执行器
   */
  async initialize() {
    console.log('[Executor] 初始化中...');
    
    // 启动紫鸟
    const started = await this.ziniao.startClient();
    if (!started) {
      throw new Error('紫鸟客户端启动失败');
    }
    
    console.log('[Executor] 初始化完成');
    return true;
  }

  /**
   * 获取店铺的浏览器控制器
   */
  async getBrowserForShop(shopId) {
    // 如果已有连接，复用
    if (this.activeBrowsers.has(shopId)) {
      const controller = this.activeBrowsers.get(shopId);
      if (controller.connected) {
        return controller;
      }
    }

    // 查询店铺信息
    const [shops] = await this.pool.query(
      'SELECT * FROM shops WHERE id = ? AND status = "active"',
      [shopId]
    );

    if (shops.length === 0) {
      throw new Error(`店铺不存在或未激活: ${shopId}`);
    }

    const shop = shops[0];

    // 启动紫鸟浏览器
    const browserInfo = await this.ziniao.ensureBrowser(shop.browser_id);

    // 创建 Selenium 控制器
    const controller = createBrowserController(
      browserInfo.debuggingPort,
      browserInfo.coreVersion
    );

    // 连接
    const connected = await controller.connect();
    if (!connected) {
      throw new Error('浏览器连接失败');
    }

    // 更新店铺最后连接时间
    await this.pool.query(
      'UPDATE shops SET last_connected_at = NOW() WHERE id = ?',
      [shopId]
    );

    this.activeBrowsers.set(shopId, controller);
    return controller;
  }

  /**
   * 执行单个任务
   */
  async executeTask(taskId) {
    console.log(`[Executor] 开始执行任务: ${taskId}`);

    // 获取任务信息
    const [tasks] = await this.pool.query(
      `SELECT t.*, s.browser_id, s.site, s.name as shop_name 
       FROM execution_tasks t 
       JOIN shops s ON t.shop_id = s.id 
       WHERE t.id = ?`,
      [taskId]
    );

    if (tasks.length === 0) {
      throw new Error(`任务不存在: ${taskId}`);
    }

    const task = tasks[0];
    const payload = typeof task.payload === 'string' 
      ? JSON.parse(task.payload) 
      : task.payload;

    // 更新状态为运行中
    await this.updateTaskStatus(taskId, 'running');

    const startTime = Date.now();
    let result = { ok: false };
    let evidenceBefore = null;
    let evidenceAfter = null;
    let evidenceError = null;

    try {
      // 获取浏览器控制器
      const browser = await this.getBrowserForShop(task.shop_id);

      // 截图：执行前
      evidenceBefore = await browser.evidenceScreenshot(task.task_no, 'before');

      // 记录日志
      await this.addLog(taskId, 1, '开始执行', 'info', `操作: ${task.action}`);

      // 获取操作处理器
      const handler = actionHandlers[task.action];
      if (!handler) {
        throw new Error(`未知的操作类型: ${task.action}`);
      }

      // 获取定位器
      const locators = getActionLocators(task.site || 'id', task.action);

      // 执行操作
      result = await handler.execute(browser, {
        payload,
        locators,
        site: task.site || 'id',
        taskNo: task.task_no,
        addLog: (step, action, status, message) => 
          this.addLog(taskId, step, action, status, message),
      });

      // 截图：执行后
      if (result.ok) {
        evidenceAfter = await browser.evidenceScreenshot(task.task_no, 'after');
      } else {
        evidenceError = await browser.evidenceScreenshot(task.task_no, 'error');
      }

    } catch (error) {
      console.error(`[Executor] 任务执行异常:`, error);
      
      result = {
        ok: false,
        error: error.message,
      };

      // 尝试截图
      try {
        const browser = this.activeBrowsers.get(task.shop_id);
        if (browser) {
          evidenceError = await browser.evidenceScreenshot(task.task_no, 'error');
        }
      } catch {}

      await this.addLog(taskId, 99, '执行异常', 'error', error.message);
    }

    // 计算耗时
    const duration = Date.now() - startTime;

    // 更新任务结果
    await this.pool.query(
      `UPDATE execution_tasks SET 
        status = ?,
        result = ?,
        error_message = ?,
        evidence_before = ?,
        evidence_after = ?,
        evidence_error = ?,
        completed_at = NOW(),
        duration_ms = ?
       WHERE id = ?`,
      [
        result.ok ? 'success' : 'failed',
        JSON.stringify(result),
        result.error || null,
        evidenceBefore,
        evidenceAfter,
        evidenceError,
        duration,
        taskId
      ]
    );

    console.log(`[Executor] 任务完成: ${task.task_no}, 状态: ${result.ok ? '成功' : '失败'}, 耗时: ${duration}ms`);

    return result;
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(taskId, status) {
    const updates = { status };
    
    if (status === 'running') {
      await this.pool.query(
        'UPDATE execution_tasks SET status = ?, started_at = NOW() WHERE id = ?',
        [status, taskId]
      );
    } else {
      await this.pool.query(
        'UPDATE execution_tasks SET status = ? WHERE id = ?',
        [status, taskId]
      );
    }
  }

  /**
   * 添加执行日志
   */
  async addLog(taskId, step, action, status, message, screenshot = null) {
    await this.pool.query(
      `INSERT INTO execution_logs (task_id, step, action, status, message, screenshot)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [taskId, step, action, status, message, screenshot]
    );
  }

  /**
   * 获取下一个待执行的任务
   */
  async getNextTask() {
    const [tasks] = await this.pool.query(
      `SELECT id FROM execution_tasks 
       WHERE status = 'queued' 
       ORDER BY priority DESC, created_at ASC 
       LIMIT 1`
    );

    return tasks.length > 0 ? tasks[0].id : null;
  }

  /**
   * 运行任务循环
   */
  async runLoop(pollInterval = 5000) {
    this.isRunning = true;
    console.log('[Executor] 开始任务循环...');

    while (this.isRunning) {
      try {
        const taskId = await this.getNextTask();

        if (taskId) {
          await this.executeTask(taskId);
          // 任务执行完后短暂等待
          await this.sleep(1000);
        } else {
          // 无任务，等待
          await this.sleep(pollInterval);
        }
      } catch (error) {
        console.error('[Executor] 循环异常:', error);
        await this.sleep(5000);
      }
    }
  }

  /**
   * 停止执行
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * 清理资源
   */
  async cleanup() {
    console.log('[Executor] 清理资源...');

    // 断开所有浏览器连接
    for (const [shopId, controller] of this.activeBrowsers) {
      try {
        await controller.disconnect();
      } catch {}
    }
    this.activeBrowsers.clear();

    // 退出紫鸟
    try {
      await this.ziniao.exitClient();
    } catch {}

    console.log('[Executor] 清理完成');
  }

  /**
   * 辅助方法
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 创建执行器实例
function createExecutor(pool) {
  return new Executor(pool);
}

module.exports = {
  Executor,
  createExecutor,
};
