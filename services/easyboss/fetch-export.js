/**
 * EasyBoss 订单导出采集服务
 * 
 * 通过 EasyBoss 导出API获取包含成本明细的订单数据
 * 用于补充 eb_orders 表中的成本字段：
 *   - purchase_price_total  商品成本(整单-CNY)
 *   - packaging_cost        包材费(CNY)
 *   - forwarder_freight     三方仓操作费(CNY)
 *   - other_cost            其他成本(CNY)
 * 
 * 流程：
 *   1. createOrderExportTask  创建导出任务
 *   2. getOrderExportTaskList 轮询等待完成
 *   3. 下载 ossUrl 的 Excel
 *   4. 解析并 UPDATE eb_orders
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const EasyBossHttpAuth = require('./http-auth');

class EasyBossExportFetcher {
  constructor(pool) {
    this.pool = pool;
    this.httpAuth = new EasyBossHttpAuth(pool);
    this.baseUrl = 'https://www.easyboss.com';
    this.templateId = '1950'; // 你的导出模板ID
    this.maxPollMinutes = 30;  // 最大等待30分钟
    this.pollIntervalMs = 30000; // 每30秒查一次
  }

  /**
   * 获取Cookie字符串
   */
  async getCookieString() {
    const saved = await this.httpAuth.getCookie();
    if (saved && saved.cookieString) {
      return saved.cookieString;
    }
    // 自动登录
    const result = await this.httpAuth.loginAndSave();
    if (result.success) return result.cookieString;
    throw new Error('无法获取Cookie: ' + (result.error || '未知错误'));
  }

  /**
   * 发送HTTPS请求到EasyBoss
   */
  async request(apiPath, params = {}, method = 'POST') {
    const cookie = await this.getCookieString();
    
    return new Promise((resolve, reject) => {
      const body = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');

      const url = new URL(this.baseUrl + '/api/order/' + apiPath);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + (method === 'GET' && body ? '?' + body : ''),
        method,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://www.easyboss.com/order/list',
          ...(method === 'POST' ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        },
        timeout: 30000,
      };

      const req = https.request(options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.result === 'fail' && (json.code === 50001 || json.reason?.includes('登录失效'))) {
              reject(new Error('Cookie失效，需要重新登录'));
            } else {
              resolve(json);
            }
          } catch {
            reject(new Error('JSON解析失败: ' + data.substring(0, 200)));
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });
      if (method === 'POST') req.write(body);
      req.end();
    });
  }

  /**
   * Step 1: 创建导出任务
   */
  async createExportTask(dateFrom, dateTo) {
    console.log(`[导出] 创建导出任务: ${dateFrom} ~ ${dateTo}`);

    // 构造导出所需的成本相关字段
    const checkedFields = [
      'platformName',                        // 平台
      'shopNick',                             // 店铺别名
      'platformOrderSn',                      // 订单编号
      'appOrderStatusText',                   // 订单状态
      'accountCurrencyEscrowAmount',          // 平台回款金额(CNY)
      'accountCurrencyTotalPurchasePrice',    // 商品成本(整单-CNY)
      'purchasePriceTotal',                   // 商品成本(产品-CNY)
      'accountCurrencyForwarderFreight',      // 三方仓操作费(CNY)
      'packagingCost',                        // 包材费(CNY)
      'accountCurrencyOtherCost',             // 其他成本(CNY)
      'accountCurrencyCommissionFee',         // 佣金(CNY)
      'accountCurrencySellerTransactionFee',  // 手续费(CNY)
      'accountCurrencyTotalProfit',           // 利润(CNY)
      'platformOuterSkuId',                   // 平台SKU
      'platformItemId',                       // 产品ID
      'goodsSkuOuterId',                      // 商品SKU
      'goodsName',                            // 商品名称
      'quantity',                             // 产品数量
      'gmtOrderStart',                        // 下单时间
      'gmtPay',                               // 付款时间
    ];

    const params = {
      exportType: 'order_detail',
      accountOpOrderExportTemplateId: this.templateId,
      exportMode: '1',
      showMode: '1',
      exportBundleType: 'bundle',
      bizCode: 'opOrders',
      imageWidth: '80',
      imageHeight: '80',
      'searchCondition[appPackageTab]': 'all',
      'searchCondition[sortField]': 'gmtOrderStart',
      'searchCondition[sortType]': 'desc',
      'searchCondition[gmtOrderStartFrom]': dateFrom,
      'searchCondition[gmtOrderStartTo]': dateTo,
      'searchCondition[remarkRp]': 'ss',
      'searchCondition[appPackageNosRp]': 'ss',
      'searchCondition[platformOrderSnsRp]': 'ss',
      'searchCondition[goodsSkuOuterIdRp]': 'ss',
      'searchCondition[platformOuterSkuIdRp]': 'ss',
      'searchCondition[purchaseSelectType]': 'purchaseInfo',
      'searchCondition[logisticsKeywordRp]': 'ss',
      'searchCondition[skuSubNameRp]': 'ss',
      'searchCondition[goodsNameRp]': 'ss',
      'searchCondition[consigneeZipCodeRp]': 'ss',
    };

    // 添加 checkedFields 数组
    checkedFields.forEach((field, i) => {
      params[`checkedFields[${i}]`] = field;
    });

    const result = await this.request('createOrderExportTask', params);
    
    if (result.result !== 'success' || !result.opOrderExportTaskId) {
      throw new Error('创建导出任务失败: ' + JSON.stringify(result));
    }

    console.log(`[导出] 任务创建成功, taskId: ${result.opOrderExportTaskId}`);
    return result.opOrderExportTaskId;
  }

  /**
   * Step 2: 轮询等待导出完成
   */
  async waitForExport(taskId) {
    console.log(`[导出] 等待任务 ${taskId} 完成...`);
    
    const startTime = Date.now();
    const maxWaitMs = this.maxPollMinutes * 60 * 1000;

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise(r => setTimeout(r, this.pollIntervalMs));

      const result = await this.request(
        `getOrderExportTask?bizCode=opOrders&opOrderExportTaskId=${taskId}`,
        {},
        'GET'
      );

      // 如果返回的是列表格式
      const task = result.list 
        ? result.list.find(t => t.accountBizExportTaskId === String(taskId))
        : result;

      if (!task) {
        console.log(`[导出] 任务 ${taskId} 未找到，继续等待...`);
        continue;
      }

      const progress = task.progress || 0;
      const status = task.status;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      
      console.log(`[导出] 进度: ${progress}% | 状态: ${status} | 耗时: ${elapsed}s`);

      if (status === 'success' || status === 'completed') {
        const ossUrl = task.ossUrl || task.ossPath;
        if (!ossUrl) {
          throw new Error('导出完成但无下载链接');
        }
        console.log(`[导出] ✅ 完成! 下载链接: ${ossUrl}`);
        return ossUrl;
      }

      if (status === 'failed' || status === 'error') {
        throw new Error('导出任务失败: ' + (task.reason || '未知原因'));
      }
    }

    throw new Error(`导出任务超时 (${this.maxPollMinutes}分钟)`);
  }

  /**
   * Step 2.5: 备用方案 - 通过任务列表查询
   */
  async waitForExportViaList(taskId) {
    console.log(`[导出] 通过任务列表等待 ${taskId} 完成...`);
    
    const startTime = Date.now();
    const maxWaitMs = this.maxPollMinutes * 60 * 1000;

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise(r => setTimeout(r, this.pollIntervalMs));

      const result = await this.request(
        'getOrderExportTaskList',
        { bizCode: 'opOrders' },
        'GET'
      );

      if (!result.list) continue;

      const task = result.list.find(t => String(t.accountBizExportTaskId) === String(taskId));
      if (!task) continue;

      const progress = task.progress || 0;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`[导出] 进度: ${progress}% | 状态: ${task.status} | 耗时: ${elapsed}s`);

      if (task.status === 'success' && task.ossUrl) {
        console.log(`[导出] ✅ 完成!`);
        return task.ossUrl;
      }

      if (task.status === 'failed') {
        throw new Error('导出失败: ' + (task.reason || ''));
      }
    }

    throw new Error(`导出超时 (${this.maxPollMinutes}分钟)`);
  }

  /**
   * Step 3: 下载Excel文件
   */
  async downloadFile(ossUrl) {
    const tmpFile = path.join(__dirname, `export_${Date.now()}.xlsx`);
    console.log(`[导出] 下载文件到 ${tmpFile}`);

    // ossUrl 可能是相对路径或完整URL
    const fullUrl = ossUrl.startsWith('http') ? ossUrl : this.baseUrl + ossUrl;
    const cookie = await this.getCookieString();

    return new Promise((resolve, reject) => {
      const url = new URL(fullUrl);
      const client = url.protocol === 'https:' ? https : http;

      const req = client.request({
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'Cookie': cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        },
        timeout: 120000,
      }, res => {
        // 处理重定向
        if (res.statusCode === 301 || res.statusCode === 302) {
          const redirectUrl = res.headers.location;
          console.log(`[导出] 重定向到: ${redirectUrl}`);
          this.downloadFile(redirectUrl).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`下载失败: HTTP ${res.statusCode}`));
          return;
        }

        const ws = fs.createWriteStream(tmpFile);
        res.pipe(ws);
        ws.on('finish', () => {
          ws.close();
          const size = fs.statSync(tmpFile).size;
          console.log(`[导出] ✅ 下载完成, 文件大小: ${(size / 1024).toFixed(1)}KB`);
          resolve(tmpFile);
        });
        ws.on('error', reject);
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('下载超时')); });
      req.end();
    });
  }

  /**
   * Step 4: 解析Excel并更新数据库
   */
  async parseAndUpdate(filePath) {
    // 动态加载xlsx库
    let XLSX;
    try {
      XLSX = require('xlsx');
    } catch {
      throw new Error('缺少xlsx库，请运行: npm install xlsx');
    }

    console.log(`[导出] 解析Excel: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`[导出] 读取到 ${rows.length} 行数据`);

    if (rows.length === 0) {
      console.log('[导出] 无数据，跳过');
      return { updated: 0, total: 0 };
    }

    // 打印第一行看字段名
    console.log('[导出] 字段名:', Object.keys(rows[0]).join(', '));

    let updated = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        const orderSn = row['订单编号'] || row['platformOrderSn'];
        if (!orderSn) continue;

        // 提取成本字段（兼容中英文列名）
        const purchasePrice = parseFloat(
          row['商品成本(整单-CNY)'] || row['accountCurrencyTotalPurchasePrice'] || 0
        ) || 0;
        const packagingCost = parseFloat(
          row['包材费(CNY)'] || row['packagingCost'] || 0
        ) || 0;
        const forwarderFreight = parseFloat(
          row['三方仓操作费(CNY)'] || row['accountCurrencyForwarderFreight'] || 0
        ) || 0;
        const otherCost = parseFloat(
          row['其他成本(CNY)'] || row['accountCurrencyOtherCost'] || 0
        ) || 0;

        const [result] = await this.pool.query(
          `UPDATE eb_orders SET 
            purchase_price_total = ?,
            packaging_cost = ?,
            forwarder_freight = ?,
            other_cost = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE platform_order_sn = ?`,
          [purchasePrice, packagingCost, forwarderFreight, otherCost, orderSn]
        );

        if (result.affectedRows > 0) updated++;
      } catch (err) {
        errors++;
        if (errors <= 3) {
          console.error(`[导出] UPDATE失败:`, err.message);
        }
      }
    }

    console.log(`[导出] ✅ 更新完成: ${updated}/${rows.length} 条 (${errors} 错误)`);

    // 清理临时文件
    try { fs.unlinkSync(filePath); } catch {}

    return { updated, total: rows.length, errors };
  }

  /**
   * 完整流程：创建导出 → 等待 → 下载 → 解析入库
   */
  async fetchAndSync(dateFrom, dateTo) {
    const startTime = Date.now();
    console.log(`\n${'='.repeat(50)}`);
    console.log(`[导出采集] 开始: ${dateFrom} ~ ${dateTo}`);
    console.log('='.repeat(50));

    try {
      // 确保Cookie有效
      await this.httpAuth.ensureFreshCookie();

      // Step 1: 创建导出任务
      const taskId = await this.createExportTask(dateFrom, dateTo);

      // Step 2: 等待完成
      let ossUrl;
      try {
        ossUrl = await this.waitForExport(taskId);
      } catch {
        // 备用方案
        console.log('[导出] 切换到列表查询模式...');
        ossUrl = await this.waitForExportViaList(taskId);
      }

      // Step 3: 下载
      const filePath = await this.downloadFile(ossUrl);

      // Step 4: 解析并更新
      const result = await this.parseAndUpdate(filePath);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n[导出采集] ✅ 全部完成! 耗时: ${duration}s`);
      console.log(`  更新: ${result.updated} 条 | 总计: ${result.total} 条`);

      return {
        success: true,
        taskId,
        ...result,
        duration: parseFloat(duration),
      };
    } catch (err) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`\n[导出采集] ❌ 失败 (${duration}s):`, err.message);
      return {
        success: false,
        error: err.message,
        duration: parseFloat(duration),
      };
    }
  }

  /**
   * 便捷方法：同步最近N天的成本数据
   */
  async syncRecentDays(days = 7) {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - days);

    const dateFrom = from.toISOString().split('T')[0] + ' 00:00:00';
    const dateTo = now.toISOString().split('T')[0] + ' 23:59:59';

    return this.fetchAndSync(dateFrom, dateTo);
  }
}

module.exports = EasyBossExportFetcher;
