/**
 * EasyBoss 定时任务调度器
 * 定时从 EasyBoss 拉取广告数据
 * 支持手动触发和自动调度
 */

const EasyBossFetcher = require('./fetch-ads');
const { getAuthInstance } = require('./auth');

class EasyBossScheduler {
  constructor(pool) {
    this.pool = pool;
    this.fetcher = new EasyBossFetcher(pool);
    this.timer = null;
    this.isRunning = false;
    this.lastRun = null;
    this.lastResult = null;
    this.intervalMs = 4 * 3600 * 1000; // 默认4小时拉一次
    this.errorCount = 0;
    this.maxErrors = 5; // 连续5次失败暂停
  }

  /**
   * 启动定时任务
   */
  start(intervalHours = 4) {
    if (this.timer) {
      console.log('[Scheduler] 定时任务已在运行');
      return;
    }

    this.intervalMs = intervalHours * 3600 * 1000;
    console.log(`[Scheduler] 启动定时任务，间隔 ${intervalHours} 小时`);

    // 立即执行一次
    this.runOnce();

    // 设置定时器
    this.timer = setInterval(() => {
      this.runOnce();
    }, this.intervalMs);
  }

  /**
   * 停止定时任务
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[Scheduler] 定时任务已停止');
    }
  }

  /**
   * 执行一次数据拉取
   */
  async runOnce(options = {}) {
    if (this.isRunning) {
      console.log('[Scheduler] 任务正在执行中，跳过');
      return { success: false, reason: 'already_running' };
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('[Scheduler] 开始执行数据拉取...');

      const result = await this.fetcher.fetchAndSave(options);

      this.lastRun = new Date().toISOString();
      this.lastResult = {
        success: true,
        saved: result.saved,
        total: result.total,
        duration: Date.now() - startTime,
        timestamp: this.lastRun
      };
      this.errorCount = 0;

      console.log(`[Scheduler] 完成! 保存 ${result.saved} 条，耗时 ${this.lastResult.duration}ms`);

      // 记录到数据库
      await this._logExecution(true, result.saved, null);

      return this.lastResult;

    } catch (err) {
      this.errorCount++;
      this.lastRun = new Date().toISOString();
      this.lastResult = {
        success: false,
        error: err.message,
        duration: Date.now() - startTime,
        timestamp: this.lastRun,
        errorCount: this.errorCount
      };

      console.error(`[Scheduler] 执行失败 (${this.errorCount}/${this.maxErrors}):`, err.message);

      // 记录到数据库
      await this._logExecution(false, 0, err.message);

      // 连续失败太多次，暂停定时任务
      if (this.errorCount >= this.maxErrors) {
        console.error('[Scheduler] 连续失败次数过多，暂停定时任务');
        this.stop();
      }

      return this.lastResult;

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 记录执行日志到数据库
   */
  async _logExecution(success, savedCount, errorMsg) {
    try {
      await this.pool.query(
        `INSERT INTO eb_fetch_logs (success, saved_count, error_message, executed_at)
         VALUES (?, ?, ?, NOW())`,
        [success, savedCount, errorMsg]
      );
    } catch (e) {
      console.error('[Scheduler] 记录日志失败:', e.message);
    }
  }

  /**
   * 获取调度器状态
   */
  getStatus() {
    const auth = getAuthInstance();
    return {
      scheduler: {
        running: !!this.timer,
        interval: this.intervalMs / 3600000 + 'h',
        isExecuting: this.isRunning,
        lastRun: this.lastRun,
        lastResult: this.lastResult,
        errorCount: this.errorCount
      },
      auth: auth.getStatus()
    };
  }

  /**
   * 获取历史执行日志
   */
  async getLogs(limit = 20) {
    const [rows] = await this.pool.query(
      `SELECT * FROM eb_fetch_logs ORDER BY executed_at DESC LIMIT ?`,
      [limit]
    );
    return rows;
  }

  /**
   * 清理过期数据（保留30天）
   */
  async cleanOldData(keepDays = 30) {
    try {
      const [result] = await this.pool.query(
        `DELETE FROM eb_ad_metrics WHERE date < DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
        [keepDays]
      );
      console.log(`[Scheduler] 清理了 ${result.affectedRows} 条过期数据`);
      return result.affectedRows;
    } catch (e) {
      console.error('[Scheduler] 清理失败:', e.message);
      return 0;
    }
  }

  /**
   * 关闭（清理资源）
   */
  async shutdown() {
    this.stop();
    const auth = getAuthInstance();
    await auth.close();
    console.log('[Scheduler] 已关闭');
  }
}

module.exports = EasyBossScheduler;
