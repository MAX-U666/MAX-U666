/**
 * GMV MAX 每日定时数据拉取
 * 
 * 功能：
 * 1. 拉取订单数据（近7天）
 * 2. 拉取广告数据
 * 3. 拉取商品数据 + 广告匹配
 * 4. 企业微信通知（成功/失败/Cookie失效）
 * 
 * 用法：
 *   node daily-sync.js          # 手动执行
 *   crontab: 0 21 * * * ...     # UTC 21:00 = 北京 05:00
 */

const mysql = require('mysql2/promise');
const https = require('https');
const http = require('http');

// ========== 配置 ==========
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  database: 'gmvmax',
  charset: 'utf8mb4',
};

const WECHAT_WEBHOOK = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=f74c9925-3967-4f21-b1d7-fae4865565cf';

// ========== 企业微信通知 ==========
async function notify(content) {
  console.log('[通知]', content.replace(/<[^>]+>/g, ''));
  
  // 方式1: 直连企业微信
  try {
    await sendWechat(content);
    console.log('[通知] 企业微信发送成功');
    return;
  } catch (e) {
    console.log('[通知] 直连失败:', e.message);
  }

  // 方式2: 通过本机API中转
  try {
    await sendViaLocalApi(content);
    console.log('[通知] 本机中转发送成功');
    return;
  } catch (e) {
    console.log('[通知] 中转失败:', e.message);
  }

  console.log('[通知] 所有通知方式均失败，仅日志记录');
}

function sendWechat(content) {
  return new Promise((resolve, reject) => {
    const url = new URL(WECHAT_WEBHOOK);
    const data = JSON.stringify({ msgtype: 'markdown', markdown: { content } });
    
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: 10000,
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const r = JSON.parse(body);
          r.errcode === 0 ? resolve(r) : reject(new Error(r.errmsg));
        } catch { resolve(body); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

function sendViaLocalApi(content) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ content });
    const req = http.request({
      hostname: 'localhost', port: 3001,
      path: '/api/easyboss/notify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: 5000,
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

// ========== 调用本机API ==========
function callLocalApi(path, method = 'POST', body = {}) {
  return new Promise((resolve, reject) => {
    const data = method === 'POST' ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: 'localhost', port: 3001, path, method,
      headers: { 
        'Content-Type': 'application/json',
        ...(method === 'POST' ? { 'Content-Length': Buffer.byteLength(data) } : {})
      },
      timeout: 300000,
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error(`解析失败: ${body.substring(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时(5min)')); });
    if (method === 'POST') req.write(data);
    req.end();
  });
}

// ========== Cookie检查 ==========
async function checkCookie(pool) {
  try {
    const [rows] = await pool.query(
      "SELECT config_value, updated_at FROM eb_config WHERE config_key = 'easyboss_cookie'"
    );
    if (rows.length === 0) return { valid: false, reason: 'Cookie未设置' };
    
    const cookie = rows[0].config_value;
    const updatedAt = new Date(rows[0].updated_at);
    const hours = Math.round((Date.now() - updatedAt.getTime()) / 3600000);
    
    if (!cookie || cookie.length < 20) return { valid: false, reason: 'Cookie为空' };
    if (hours > 72) return { valid: false, reason: `Cookie已${hours}小时未更新` };
    
    return { valid: true, hours };
  } catch (e) {
    return { valid: false, reason: e.message };
  }
}

// ========== 主流程 ==========
async function main() {
  const startTime = Date.now();
  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`[每日同步] ${timestamp}`);
  console.log('='.repeat(50));

  const pool = mysql.createPool(DB_CONFIG);
  const results = { orders: null, ads: null, products: null, errors: [] };

  try {
    // Step 0: Cookie检查
    const ck = await checkCookie(pool);
    if (!ck.valid) {
      await notify(
        `## ⚠️ GMV MAX Cookie告警\n\n` +
        `> ${timestamp}\n` +
        `> <font color="warning">${ck.reason}</font>\n\n` +
        `请更新Cookie: POST /api/easyboss/orders/set-cookie`
      );
      console.log('[警告] Cookie可能失效，继续尝试...');
    } else {
      console.log(`[Cookie] 有效 (${ck.hours}h前更新)`);
    }

    // Step 1: 订单
    console.log('\n[1/3] 拉取订单...');
    try {
      results.orders = await callLocalApi('/api/easyboss/orders/fetch', 'POST', { days: 7 });
      if (results.orders.success === false) throw new Error(results.orders.error || '未知错误');
      console.log(`  ✅ ${results.orders.ordersInserted || 0}新增 / ${results.orders.ordersUpdated || 0}更新`);
    } catch (e) {
      results.errors.push(`订单: ${e.message}`);
      console.error('  ❌', e.message);
    }

    // Step 2: 广告
    console.log('\n[2/3] 拉取广告...');
    try {
      results.ads = await callLocalApi('/api/easyboss/ads/fetch', 'POST', { status: 'ongoing' });
      if (results.ads.success === false) throw new Error(results.ads.error || '未知错误');
      console.log(`  ✅ ${results.ads.campaignsFetched || 0}条`);
    } catch (e) {
      results.errors.push(`广告: ${e.message}`);
      console.error('  ❌', e.message);
    }

    // Step 3: 商品+匹配
    console.log('\n[3/3] 拉取商品...');
    try {
      results.products = await callLocalApi('/api/easyboss/products/fetch', 'POST', { status: '', matchAds: true });
      if (results.products.success === false) throw new Error(results.products.error || '未知错误');
      console.log(`  ✅ ${results.products.productsFetched || 0}条 / 匹配${results.products.adsMatched || 0}`);
    } catch (e) {
      results.errors.push(`商品: ${e.message}`);
      console.error('  ❌', e.message);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const errCount = results.errors.length;

    // 构建通知
    let msg;
    if (errCount === 3) {
      msg = `## ❌ GMV MAX 同步失败\n\n` +
        `> ${timestamp} | ${duration}s\n\n` +
        results.errors.map(e => `- <font color="warning">${e}</font>`).join('\n') +
        `\n\n**Cookie可能已失效，请更新**`;
    } else if (errCount > 0) {
      msg = `## ⚠️ GMV MAX 同步部分失败\n\n` +
        `> ${timestamp} | ${duration}s\n\n`;
      if (results.orders?.success) msg += `- ✅ 订单: ${results.orders.ordersInserted || 0}新 / ${results.orders.ordersUpdated || 0}更新\n`;
      if (results.ads?.success) msg += `- ✅ 广告: ${results.ads.campaignsFetched || 0}条\n`;
      if (results.products?.success) msg += `- ✅ 商品: ${results.products.productsFetched || 0}条\n`;
      msg += `\n**失败:**\n` + results.errors.map(e => `- <font color="warning">${e}</font>`).join('\n');
    } else {
      msg = `## ✅ GMV MAX 每日同步完成\n\n` +
        `> ${timestamp} | ${duration}s\n\n` +
        `- 📦 订单: ${results.orders?.ordersInserted || 0}新 / ${results.orders?.ordersUpdated || 0}更新\n` +
        `- 📢 广告: ${results.ads?.campaignsFetched || 0}条\n` +
        `- 🏪 商品: ${results.products?.productsFetched || 0}条 / 匹配${results.products?.adsMatched || 0}`;
    }

    await notify(msg);

    // 写入同步日志
    try {
      await pool.query(
        `INSERT INTO eb_sync_logs (sync_type, status, orders_result, ads_result, products_result, errors, duration)
         VALUES ('daily', ?, ?, ?, ?, ?, ?)`,
        [
          errCount === 0 ? 'success' : errCount === 3 ? 'failed' : 'partial',
          JSON.stringify(results.orders || {}),
          JSON.stringify(results.ads || {}),
          JSON.stringify(results.products || {}),
          results.errors.length > 0 ? results.errors.join('; ') : null,
          duration,
        ]
      );
    } catch (e) {
      // 表不存在就创建
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
      await pool.query(
        `INSERT INTO eb_sync_logs (sync_type, status, errors, duration) VALUES ('daily', ?, ?, ?)`,
        [errCount === 0 ? 'success' : 'failed', results.errors.join('; '), duration]
      );
    }

    console.log(`\n[完成] ${duration}s, 错误: ${errCount}`);

  } catch (e) {
    console.error('[致命错误]', e);
    await notify(`## ❌ GMV MAX 致命错误\n\n> ${timestamp}\n\n<font color="warning">${e.message}</font>`);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
