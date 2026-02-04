/**
 * EasyBoss 每日自动同步脚本
 * 凌晨5点执行：拉取订单 → 拉取广告 → 拉取商品 → 匹配 → 通知
 * 
 * 用法: node daily-sync.js
 * Cron: 0 5 * * * cd /www/gmv-max && node services/easyboss/daily-sync.js >> logs/daily-sync.log 2>&1
 */

const mysql = require('mysql2/promise');
const https = require('https');
const http = require('http');

// ========== 配置 ==========
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  database: 'gmvmax',
  waitForConnections: true,
  connectionLimit: 5,
};

// 企业微信机器人 Webhook（需要你填入实际地址）
const WECOM_WEBHOOK = process.env.WECOM_WEBHOOK || '';

// 拉取配置
const ORDER_DAYS = 3;        // 拉取最近3天订单
const AD_STATUS = 'ongoing'; // 拉取进行中的广告

// ========== 企业微信通知 ==========
async function sendWecom(content, msgType = 'markdown') {
  if (!WECOM_WEBHOOK) {
    console.log('[通知] 未配置企业微信Webhook，跳过通知');
    return;
  }

  const payload = JSON.stringify({
    msgtype: msgType,
    [msgType]: { content },
  });

  return new Promise((resolve) => {
    try {
      const url = new URL(WECOM_WEBHOOK);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('[通知] 企业微信响应:', data);
          resolve(true);
        });
      });
      
      req.on('error', (e) => {
        console.error('[通知] 发送失败:', e.message);
        resolve(false);
      });
      
      req.write(payload);
      req.end();
    } catch (e) {
      console.error('[通知] 异常:', e.message);
      resolve(false);
    }
  });
}

// ========== 通过HTTP调用本地API ==========
function callAPI(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 300000, // 5分钟超时
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON解析失败: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ========== Cookie有效性检测 ==========
async function checkCookie(pool) {
  try {
    const [rows] = await pool.query(
      "SELECT config_value, updated_at FROM eb_config WHERE config_key = 'easyboss_cookie'"
    );
    
    if (!rows || rows.length === 0 || !rows[0].config_value) {
      return { valid: false, reason: 'Cookie未设置', updatedAt: null };
    }

    const cookie = rows[0].config_value;
    const updatedAt = rows[0].updated_at;
    
    // 用Cookie请求EasyBoss看能否成功
    const testResult = await new Promise((resolve) => {
      const postData = JSON.stringify({
        pageNo: 1, pageSize: 1,
        data: { platformOrderStatus: '', appPackageTab: 'all' }
      });

      const req = https.request({
        hostname: 'openapi.easyboss.com',
        path: '/api/order/order/searchOrderPackageList',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookie,
          'User-Agent': 'Mozilla/5.0',
        },
        timeout: 15000,
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            // EasyBoss返回code=0表示成功
            if (json.code === 0 || json.code === '0') {
              resolve({ valid: true });
            } else {
              resolve({ valid: false, reason: `API返回: code=${json.code}, msg=${json.msg || ''}` });
            }
          } catch (e) {
            resolve({ valid: false, reason: `响应解析失败: ${data.substring(0, 100)}` });
          }
        });
      });

      req.on('error', (e) => resolve({ valid: false, reason: `请求失败: ${e.message}` }));
      req.on('timeout', () => { req.destroy(); resolve({ valid: false, reason: '请求超时' }); });
      req.write(postData);
      req.end();
    });

    return { ...testResult, updatedAt };
  } catch (e) {
    return { valid: false, reason: `检测异常: ${e.message}`, updatedAt: null };
  }
}

// ========== 主流程 ==========
async function main() {
  const startTime = Date.now();
  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[Daily Sync] 开始执行 - ${timestamp}`);
  console.log('='.repeat(60));

  let pool;
  const results = {
    cookie: null,
    orders: null,
    ads: null,
    products: null,
    errors: [],
  };

  try {
    pool = mysql.createPool(DB_CONFIG);

    // ========== Step 1: 检查Cookie ==========
    console.log('\n[Step 1] 检查Cookie有效性...');
    const cookieCheck = await checkCookie(pool);
    results.cookie = cookieCheck;

    if (!cookieCheck.valid) {
      console.error(`[Step 1] ❌ Cookie无效: ${cookieCheck.reason}`);
      results.errors.push(`Cookie无效: ${cookieCheck.reason}`);

      // 立即发送告警
      await sendWecom(
        `## ⚠️ GMV MAX Cookie失效告警\n` +
        `> 时间: ${timestamp}\n` +
        `> 原因: <font color="warning">${cookieCheck.reason}</font>\n` +
        `> Cookie更新时间: ${cookieCheck.updatedAt || '未知'}\n\n` +
        `**请尽快登录EasyBoss更新Cookie：**\n` +
        `POST /api/easyboss/orders/set-cookie`
      );

      // Cookie失效就不继续拉取了
      return results;
    }
    console.log('[Step 1] ✅ Cookie有效');

    // ========== Step 2: 拉取订单 ==========
    console.log(`\n[Step 2] 拉取最近${ORDER_DAYS}天订单...`);
    try {
      const orderResult = await callAPI('/api/easyboss/orders/fetch', 'POST', { days: ORDER_DAYS });
      results.orders = orderResult;
      if (orderResult.success) {
        console.log(`[Step 2] ✅ 订单: ${orderResult.newOrders || 0}条新增, ${orderResult.updatedOrders || 0}条更新`);
      } else {
        console.error(`[Step 2] ❌ 订单拉取失败: ${orderResult.error}`);
        results.errors.push(`订单: ${orderResult.error}`);
      }
    } catch (e) {
      console.error(`[Step 2] ❌ 订单异常: ${e.message}`);
      results.errors.push(`订单异常: ${e.message}`);
    }

    // ========== Step 3: 拉取广告 ==========
    console.log('\n[Step 3] 拉取广告数据...');
    try {
      const adResult = await callAPI('/api/easyboss/ads/fetch', 'POST', { status: AD_STATUS });
      results.ads = adResult;
      if (adResult.success) {
        console.log(`[Step 3] ✅ 广告: ${adResult.campaignsFetched || adResult.total || 0}条`);
      } else {
        console.error(`[Step 3] ❌ 广告拉取失败: ${adResult.error}`);
        results.errors.push(`广告: ${adResult.error}`);
      }
    } catch (e) {
      console.error(`[Step 3] ❌ 广告异常: ${e.message}`);
      results.errors.push(`广告异常: ${e.message}`);
    }

    // ========== Step 4: 拉取商品 + 匹配 ==========
    console.log('\n[Step 4] 拉取商品 + 广告匹配...');
    try {
      const prodResult = await callAPI('/api/easyboss/products/fetch', 'POST', { status: 'onsale', matchAds: true });
      results.products = prodResult;
      if (prodResult.success) {
        console.log(`[Step 4] ✅ 商品: ${prodResult.productsFetched}个, 广告匹配: ${prodResult.adsMatched}个`);
      } else {
        console.error(`[Step 4] ❌ 商品拉取失败: ${prodResult.error}`);
        results.errors.push(`商品: ${prodResult.error}`);
      }
    } catch (e) {
      console.error(`[Step 4] ❌ 商品异常: ${e.message}`);
      results.errors.push(`商品异常: ${e.message}`);
    }

  } catch (e) {
    console.error(`[Fatal] 致命错误: ${e.message}`);
    results.errors.push(`致命错误: ${e.message}`);
  } finally {
    if (pool) await pool.end();
  }

  // ========== 发送汇报通知 ==========
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const hasError = results.errors.length > 0;

  const orderInfo = results.orders?.success
    ? `新增${results.orders.newOrders || 0}条, 更新${results.orders.updatedOrders || 0}条`
    : `失败`;
  const adInfo = results.ads?.success
    ? `${results.ads.campaignsFetched || results.ads.total || 0}条广告`
    : `失败`;
  const prodInfo = results.products?.success
    ? `${results.products.productsFetched}个商品, ${results.products.adsMatched}个匹配`
    : `失败`;

  const emoji = hasError ? '⚠️' : '✅';
  const status = hasError ? '<font color="warning">部分失败</font>' : '<font color="info">全部成功</font>';

  const report = 
    `## ${emoji} GMV MAX 每日同步报告\n` +
    `> 时间: ${timestamp} | 耗时: ${duration}s\n` +
    `> 状态: ${status}\n\n` +
    `**同步结果：**\n` +
    `- 🛒 订单: ${orderInfo}\n` +
    `- 📢 广告: ${adInfo}\n` +
    `- 🏪 商品: ${prodInfo}\n` +
    (hasError ? `\n**⚠️ 错误：**\n${results.errors.map(e => `- ${e}`).join('\n')}\n` : '');

  console.log(`\n[报告]\n${report}`);
  await sendWecom(report);

  console.log(`\n[Daily Sync] 完成 - 耗时 ${duration}s`);
  console.log('='.repeat(60));

  // 非0退出码供cron检测
  if (hasError) process.exit(1);
}

main().catch(e => {
  console.error('[Fatal]', e);
  sendWecom(`## 🔴 GMV MAX 同步崩溃\n> ${e.message}`).then(() => process.exit(2));
});
