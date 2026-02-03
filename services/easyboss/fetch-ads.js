/**
 * EasyBoss 广告数据拉取模块
 * 从 EasyBoss ERP 抓取广告活动数据
 * 支持按店铺、日期范围筛选
 */

const { getAuthInstance } = require('./auth');

class EasyBossFetcher {
  constructor(pool) {
    this.pool = pool; // MySQL 连接池
    this.auth = getAuthInstance();
    this.baseUrl = 'https://www.easyboss.com';
  }

  /**
   * 拉取广告数据（通过页面拦截 API）
   * EasyBoss 广告页面加载时会请求内部 API
   */
  async fetchAdData(options = {}) {
    const {
      shopId = null,       // 店铺ID，null = 全部
      dateFrom = null,     // 开始日期 YYYY-MM-DD
      dateTo = null,       // 结束日期 YYYY-MM-DD
    } = options;

    try {
      console.log('[EasyBoss] 开始拉取广告数据...');
      
      const page = await this.auth.getPage();
      
      // 收集所有 API 响应
      const apiResponses = [];
      
      // 监听网络请求
      const responseHandler = async (response) => {
        const url = response.url();
        // 匹配可能的广告数据 API 路径
        if (url.includes('/api/') && (
          url.includes('ad') || 
          url.includes('campaign') || 
          url.includes('marketing') ||
          url.includes('promote')
        )) {
          try {
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('json')) {
              const data = await response.json();
              apiResponses.push({ url, data, status: response.status() });
              console.log(`[EasyBoss] 捕获API: ${url.substring(0, 100)}...`);
            }
          } catch (e) {
            // 忽略非JSON响应
          }
        }
      };

      page.on('response', responseHandler);

      // 导航到广告管理页面
      // 常见路径：/marketing/ad 或 /ads 或 /campaign
      const adUrls = [
        `${this.baseUrl}/marketing/ad`,
        `${this.baseUrl}/marketing/ads`, 
        `${this.baseUrl}/ads`,
        `${this.baseUrl}/campaign`,
        `${this.baseUrl}/marketing`
      ];

      let navigated = false;
      for (const adUrl of adUrls) {
        try {
          await page.goto(adUrl, { waitUntil: 'networkidle', timeout: 20000 });
          const currentUrl = page.url();
          if (!currentUrl.includes('/login')) {
            navigated = true;
            console.log(`[EasyBoss] 已导航到: ${currentUrl}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!navigated) {
        // 从首页找广告入口
        await page.goto(this.baseUrl, { waitUntil: 'networkidle', timeout: 20000 });
        // 尝试点击菜单
        const menuItems = await page.$$('a, [class*="menu"], [class*="nav"]');
        for (const item of menuItems) {
          const text = await item.textContent().catch(() => '');
          if (text.includes('营销') || text.includes('广告') || text.includes('Marketing') || text.includes('Ad')) {
            await item.click();
            await page.waitForTimeout(3000);
            navigated = true;
            console.log('[EasyBoss] 通过菜单导航到广告页面');
            break;
          }
        }
      }

      // 等待数据加载
      await page.waitForTimeout(5000);

      // 如果需要选择日期范围
      if (dateFrom || dateTo) {
        await this._selectDateRange(page, dateFrom, dateTo);
        await page.waitForTimeout(3000);
      }

      // 如果需要选择店铺
      if (shopId) {
        await this._selectShop(page, shopId);
        await page.waitForTimeout(3000);
      }

      // 移除监听器
      page.removeListener('response', responseHandler);

      // 如果 API 拦截有数据，直接用
      if (apiResponses.length > 0) {
        console.log(`[EasyBoss] 捕获到 ${apiResponses.length} 个API响应`);
        return this._parseApiResponses(apiResponses);
      }

      // 否则尝试从页面 DOM 抓取
      console.log('[EasyBoss] 未捕获到API，尝试DOM抓取...');
      return await this._scrapeFromDOM(page);

    } catch (err) {
      console.error('[EasyBoss] 拉取广告数据失败:', err.message);
      throw err;
    }
  }

  /**
   * 选择日期范围
   */
  async _selectDateRange(page, dateFrom, dateTo) {
    try {
      // 查找日期选择器
      const dateInputs = await page.$$('input[type="date"], input[placeholder*="日期"], .ant-picker, .date-picker, [class*="date"]');
      if (dateInputs.length >= 1) {
        await dateInputs[0].click();
        await page.waitForTimeout(1000);
        // 尝试直接设置值
        if (dateFrom) {
          await page.keyboard.type(dateFrom);
        }
        console.log('[EasyBoss] 日期范围已设置');
      }
    } catch (e) {
      console.log('[EasyBoss] 日期选择跳过:', e.message);
    }
  }

  /**
   * 选择店铺
   */
  async _selectShop(page, shopId) {
    try {
      const shopSelectors = await page.$$('select, [class*="shop"], [class*="store"], .ant-select');
      for (const selector of shopSelectors) {
        const text = await selector.textContent().catch(() => '');
        if (text.includes('店铺') || text.includes('shop') || text.includes('store')) {
          await selector.click();
          await page.waitForTimeout(1000);
          // 选择对应店铺
          const options = await page.$$('[class*="option"], li, .ant-select-item');
          for (const opt of options) {
            const optText = await opt.textContent().catch(() => '');
            if (optText.includes(shopId)) {
              await opt.click();
              break;
            }
          }
          break;
        }
      }
    } catch (e) {
      console.log('[EasyBoss] 店铺选择跳过:', e.message);
    }
  }

  /**
   * 解析拦截到的 API 响应
   */
  _parseApiResponses(responses) {
    const results = [];

    for (const { url, data } of responses) {
      // 尝试从不同格式中提取广告数据
      let items = [];
      
      if (Array.isArray(data)) {
        items = data;
      } else if (data.data && Array.isArray(data.data)) {
        items = data.data;
      } else if (data.data && data.data.list && Array.isArray(data.data.list)) {
        items = data.data.list;
      } else if (data.result && Array.isArray(data.result)) {
        items = data.result;
      } else if (data.list && Array.isArray(data.list)) {
        items = data.list;
      }

      for (const item of items) {
        const parsed = this._normalizeAdItem(item);
        if (parsed) {
          results.push(parsed);
        }
      }
    }

    console.log(`[EasyBoss] 解析得到 ${results.length} 条广告数据`);
    return results;
  }

  /**
   * 标准化广告数据字段
   */
  _normalizeAdItem(item) {
    // 映射不同的字段名
    const fieldMaps = {
      impressions: ['impressions', 'impression', 'views', 'view', 'exposure', '浏览数', '曝光'],
      clicks: ['clicks', 'click', '点击数', '点击'],
      ctr: ['ctr', 'click_rate', 'click_through_rate', '点击率'],
      orders: ['orders', 'order', 'conversions', 'conversion', '订单数', '订单'],
      sales: ['sales', 'sale', 'revenue', 'gmv', '销售金额', '销售额'],
      spend: ['spend', 'cost', 'expense', '花费', '消耗'],
      roas: ['roas', 'roi', 'return_on_ad_spend'],
      campaign_name: ['campaign_name', 'name', 'title', 'ad_name', '广告名称'],
      campaign_id: ['campaign_id', 'id', 'ad_id', '广告ID'],
      status: ['status', 'state', '状态'],
      budget: ['budget', 'daily_budget', '预算'],
      bid: ['bid', 'bid_price', '出价', '竞价'],
      shop_name: ['shop_name', 'store_name', '店铺名'],
      shop_id: ['shop_id', 'store_id', '店铺ID']
    };

    const result = {};
    let hasData = false;

    for (const [key, aliases] of Object.entries(fieldMaps)) {
      for (const alias of aliases) {
        if (item[alias] !== undefined && item[alias] !== null) {
          result[key] = item[alias];
          hasData = true;
          break;
        }
      }
    }

    // 至少要有一些关键数据才算有效
    if (!hasData || (!result.impressions && !result.clicks && !result.spend && !result.campaign_name)) {
      return null;
    }

    // 数值清洗
    result.impressions = parseInt(result.impressions) || 0;
    result.clicks = parseInt(result.clicks) || 0;
    result.orders = parseInt(result.orders) || 0;
    result.sales = parseFloat(result.sales) || 0;
    result.spend = parseFloat(result.spend) || 0;
    result.roas = result.spend > 0 ? parseFloat((result.sales / result.spend).toFixed(2)) : 0;
    result.ctr = result.impressions > 0 ? parseFloat((result.clicks / result.impressions * 100).toFixed(2)) : 0;

    return result;
  }

  /**
   * 从页面 DOM 抓取表格数据
   */
  async _scrapeFromDOM(page) {
    try {
      // 查找表格
      const tableData = await page.evaluate(() => {
        const results = [];
        
        // 方法1: 标准 table
        const tables = document.querySelectorAll('table');
        for (const table of tables) {
          const headers = [];
          const headerRow = table.querySelector('thead tr, tr:first-child');
          if (headerRow) {
            headerRow.querySelectorAll('th, td').forEach(cell => {
              headers.push(cell.textContent.trim());
            });
          }

          const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
          for (const row of rows) {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
              const rowData = {};
              cells.forEach((cell, idx) => {
                if (headers[idx]) {
                  rowData[headers[idx]] = cell.textContent.trim();
                }
              });
              if (Object.keys(rowData).length > 0) {
                results.push(rowData);
              }
            }
          }
        }

        // 方法2: ant-design 或其他 UI 框架的虚拟表格
        if (results.length === 0) {
          const rows = document.querySelectorAll('[class*="table-row"], [class*="list-item"], [class*="data-row"]');
          for (const row of rows) {
            const cells = row.querySelectorAll('[class*="cell"], [class*="col"], td');
            if (cells.length >= 3) {
              const rowData = {};
              cells.forEach((cell, idx) => {
                rowData[`col_${idx}`] = cell.textContent.trim();
              });
              results.push(rowData);
            }
          }
        }

        return results;
      });

      console.log(`[EasyBoss] DOM抓取得到 ${tableData.length} 行数据`);

      // 尝试标准化
      return tableData.map(row => this._normalizeAdItem(row)).filter(Boolean);

    } catch (err) {
      console.error('[EasyBoss] DOM抓取失败:', err.message);
      return [];
    }
  }

  /**
   * 拉取数据并保存到 MySQL
   */
  async fetchAndSave(options = {}) {
    const data = await this.fetchAdData(options);

    if (data.length === 0) {
      console.log('[EasyBoss] 没有获取到数据');
      return { saved: 0, data: [] };
    }

    const today = new Date().toISOString().split('T')[0];
    let saved = 0;

    for (const item of data) {
      try {
        await this.pool.query(
          `INSERT INTO eb_ad_metrics 
           (date, shop_id, shop_name, campaign_id, campaign_name, status,
            impressions, clicks, ctr, orders, sales, spend, roas, budget, bid,
            fetched_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
            impressions = VALUES(impressions),
            clicks = VALUES(clicks),
            ctr = VALUES(ctr),
            orders = VALUES(orders),
            sales = VALUES(sales),
            spend = VALUES(spend),
            roas = VALUES(roas),
            budget = VALUES(budget),
            bid = VALUES(bid),
            status = VALUES(status),
            fetched_at = NOW()`,
          [
            today,
            item.shop_id || 'default',
            item.shop_name || '',
            item.campaign_id || `camp_${Date.now()}_${saved}`,
            item.campaign_name || '未知广告',
            item.status || 'active',
            item.impressions,
            item.clicks,
            item.ctr,
            item.orders,
            item.sales,
            item.spend,
            item.roas,
            item.budget || 0,
            item.bid || 0
          ]
        );
        saved++;
      } catch (err) {
        console.error(`[EasyBoss] 保存数据失败:`, err.message);
      }
    }

    console.log(`[EasyBoss] 保存完成: ${saved}/${data.length} 条`);
    return { saved, total: data.length, data };
  }

  /**
   * 获取已保存的广告数据（从MySQL读取）
   */
  async getSavedMetrics(options = {}) {
    const { date, shopId, days = 7 } = options;

    let sql = `SELECT * FROM eb_ad_metrics WHERE 1=1`;
    const params = [];

    if (date) {
      sql += ` AND date = ?`;
      params.push(date);
    } else {
      sql += ` AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`;
      params.push(days);
    }

    if (shopId) {
      sql += ` AND shop_id = ?`;
      params.push(shopId);
    }

    sql += ` ORDER BY date DESC, spend DESC`;

    const [rows] = await this.pool.query(sql, params);
    return rows;
  }

  /**
   * 获取汇总数据
   */
  async getSummary(options = {}) {
    const { days = 7, shopId } = options;

    let sql = `SELECT 
      date,
      COUNT(*) as campaign_count,
      SUM(impressions) as total_impressions,
      SUM(clicks) as total_clicks,
      SUM(orders) as total_orders,
      SUM(sales) as total_sales,
      SUM(spend) as total_spend,
      CASE WHEN SUM(spend) > 0 THEN ROUND(SUM(sales) / SUM(spend), 2) ELSE 0 END as overall_roas,
      CASE WHEN SUM(impressions) > 0 THEN ROUND(SUM(clicks) / SUM(impressions) * 100, 2) ELSE 0 END as overall_ctr
    FROM eb_ad_metrics 
    WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`;
    
    const params = [days];

    if (shopId) {
      sql += ` AND shop_id = ?`;
      params.push(shopId);
    }

    sql += ` GROUP BY date ORDER BY date DESC`;

    const [rows] = await this.pool.query(sql, params);
    return rows;
  }
}

module.exports = EasyBossFetcher;
