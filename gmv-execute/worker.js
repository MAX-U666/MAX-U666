/**
 * 执行中心 Worker 进程
 * 
 * 负责：轮询任务队列、执行任务、记录结果
 * 
 * 启动方式：
 *   node worker.js
 *   或
 *   pm2 start worker.js --name "gmv-worker"
 */
const mysql = require('mysql2/promise');
const { createExecutor } = require('./services/executor');

// 数据库配置（和主服务器保持一致）
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gmvmax',
  socketPath: process.env.DB_SOCKET || '/var/run/mysqld/mysqld.sock',
  waitForConnections: true,
  connectionLimit: 5,
};

// Worker 配置
const WORKER_CONFIG = {
  pollInterval: parseInt(process.env.POLL_INTERVAL) || 5000, // 轮询间隔（毫秒）
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT) || 1,   // 最大并发（暂时只支持1）
};

let pool = null;
let executor = null;
let isShuttingDown = false;

/**
 * 初始化
 */
async function initialize() {
  console.log('==========================================');
  console.log('  GMV MAX 执行中心 Worker');
  console.log('==========================================');
  console.log(`启动时间: ${new Date().toLocaleString()}`);
  console.log(`轮询间隔: ${WORKER_CONFIG.pollInterval}ms`);
  console.log('');

  // 创建数据库连接池
  pool = mysql.createPool(DB_CONFIG);
  console.log('[Worker] 数据库连接池已创建');

  // 测试数据库连接
  try {
    const [rows] = await pool.query('SELECT 1');
    console.log('[Worker] 数据库连接正常');
  } catch (err) {
    console.error('[Worker] 数据库连接失败:', err.message);
    process.exit(1);
  }

  // 创建执行器
  executor = createExecutor(pool);
  
  // 初始化执行器（启动紫鸟）
  try {
    await executor.initialize();
    console.log('[Worker] 执行器初始化完成');
  } catch (err) {
    console.error('[Worker] 执行器初始化失败:', err.message);
    console.log('[Worker] 将在首次任务时重试初始化');
  }

  console.log('');
  console.log('[Worker] 开始监听任务队列...');
  console.log('');
}

/**
 * 主循环
 */
async function runLoop() {
  while (!isShuttingDown) {
    try {
      // 获取下一个任务
      const taskId = await executor.getNextTask();

      if (taskId) {
        console.log(`[Worker] 发现新任务: ${taskId}`);
        
        // 执行任务
        const result = await executor.executeTask(taskId);
        
        console.log(`[Worker] 任务 ${taskId} 执行完成:`, result.ok ? '成功' : '失败');
        
        // 短暂等待后继续
        await sleep(1000);
      } else {
        // 无任务，等待
        await sleep(WORKER_CONFIG.pollInterval);
      }
    } catch (error) {
      console.error('[Worker] 循环异常:', error.message);
      await sleep(5000);
    }
  }
}

/**
 * 优雅关闭
 */
async function shutdown(signal) {
  if (isShuttingDown) return;
  
  isShuttingDown = true;
  console.log('');
  console.log(`[Worker] 收到 ${signal} 信号，开始优雅关闭...`);

  // 停止执行器
  if (executor) {
    executor.stop();
    await executor.cleanup();
  }

  // 关闭数据库连接
  if (pool) {
    await pool.end();
  }

  console.log('[Worker] 已关闭');
  process.exit(0);
}

/**
 * 辅助函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 信号处理
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// 未捕获异常
process.on('uncaughtException', (err) => {
  console.error('[Worker] 未捕获异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Worker] 未处理的 Promise 拒绝:', reason);
});

// 启动
initialize()
  .then(() => runLoop())
  .catch((err) => {
    console.error('[Worker] 启动失败:', err);
    process.exit(1);
  });
