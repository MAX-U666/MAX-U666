/**
 * EasyBoss 广告数据拉取服务
 * 
 * 接口：
 * 1. searchProductCampaignList - 广告活动列表（含汇总数据）
 * 2. getProductCampaignDailyPerformanceStatDetail - 每日明细
 * 
 * 商品关联：通过 adName（广告标题）匹配 eb_order_items.title → platform_item_id
 */

const https = require('https');
const EasyBossHttpAuth = require('./http-auth');

class AdsFetcher {
  constructor(pool) {
    this.pool = pool;
    this.cookieString = null;
    this.baseUrl = 'https://www.easyboss.com/api/platform/shopee/ads/ads';
    this.loginRetried = false;
    
    // 所有店铺ID
    this.allShopIds = [
      '1259862', '1259850', '1259865', '1259869', '1259870',
      '1259878', '1259971', '1259966', '1259948', '1259933',
      '1259925', '1260204', '1260105', '1259842', '1259847',
      '1259853', '1259856', '1259858', '2256701', '2149211',
      '2053413', '2052766', '2035937', '1259950'
    ];
  }

  // 从数据库读取cookie，失效则自动登录
  async ensureCookie() {
    if (this.cookieString) return true;
    try {
      const [rows] = await this.pool.query(
        "SELECT config_value FROM eb_config WHERE config_key = 'easyboss_cookie'"
      );
      if (rows.length > 0 && rows[0].config_value) {
        this.cookieString = rows[0].config_value;
        return true;
      }
      
      // 没有cookie，尝试自动登录
      console.log('[广告拉取] 未找到Cookie，尝试自动登录...');
      return await this.autoLogin();
    } catch (e) {
      console.error('[广告拉取] 读取cookie失败:', e.message);
    }
    return false;
  }

  // HTTP API 自动登录
  async autoLogin() {
    try {
      const httpAuth = new EasyBossHttpAuth(this.pool);
      const result = await httpAuth.loginAndSave();
      
      if (!result.success) {
        console.error('[广告拉取] HTTP登录失败:', result.error);
        return false;
      }

      this.cookieString = result.cookieString;
      console.log(`[广告拉取] ✅ HTTP登录成功，Cookie已保存`);
      return true;
    } catch (err) {
      console.error('[广告拉取] 登录异常:', err.message);
      return false;
    }
  }

  // Cookie失效时重新登录
  async refreshLogin() {
    console.log('[广告拉取] Cookie失效，尝试重新登录...');
    const oldCookie = this.cookieString;
    this.cookieString = null;
    this.loginRetried = true;
    
    const success = await this.autoLogin();
    if (!success && oldCookie) {
      // 自动登录失败，恢复旧cookie（可能只是临时问题）
      console.log('[广告拉取] 自动登录失败，保留旧Cookie');
      this.cookieString = oldCookie;
    }
    return success;
  }

  // HTTP POST请求
  async postRequest(url, data, timeout = 60000) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const postData = typeof data === 'string' ? data : new URLSearchParams(data).toString();

      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Cookie': this.cookieString,
          'X-language': 'zh-cn',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`JSON解析失败: ${body.substring(0, 200)}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(timeout, () => {
        req.destroy();
        reject(new Error('请求超时'));
      });

      req.write(postData);
      req.end();
    });
  }

  // 构建shopIds参数字符串
  buildShopIdsParam(shopIds) {
    return shopIds.map((id, i) => `shopIds%5B${i}%5D=${id}`).join('&');
  }

  /**
   * 拉取广告活动列表
   * @param {string} status - ongoing/paused/ended/空(全部)
   * @param {number} pageSize - 每页条数
   */
  async fetchCampaignList(status = 'ongoing', pageSize = 20) {
    const allCampaigns = [];
    let pageNo = 1;
    let total = 0;

    console.log(`[广告拉取] 开始拉取广告列表 (status=${status || '全部'})...`);

    do {
      const shopIdsParam = this.buildShopIdsParam(this.allShopIds);
      const data = `campaignStatus=${status}&${shopIdsParam}&pageNo=${pageNo}&pageSize=${pageSize}`;

      try {
        const result = await this.postRequest(`${this.baseUrl}/searchProductCampaignList`, data);

        // 检测登录失效
        if (result.result === 'fail' && (result.code === 50001 || (result.reason && result.reason.includes('登录失效')))) {
          if (!this.loginRetried) {
            console.log('[广告拉取] 检测到登录失效，尝试重新登录...');
            const refreshed = await this.refreshLogin();
            if (refreshed) {
              pageNo = 1; // 重置页码重新开始
              allCampaigns.length = 0;
              continue;
            }
          }
          console.error('[广告拉取] 登录失效且重试失败');
          break;
        }

        if (result.result !== 'success') {
          console.error(`[广告拉取] 第${pageNo}页失败:`, result);
          break;
        }

        // 成功后重置重试标记
        this.loginRetried = false;

        total = parseInt(result.total) || 0;
        const list = result.promotionList || [];
        allCampaigns.push(...list);

        console.log(`[广告拉取] 第 ${pageNo}/${Math.ceil(total / pageSize)} 页，本页 ${list.length} 条，累计 ${allCampaigns.length}/${total}`);

        pageNo++;

        // 防止被限流，间隔200ms
        await new Promise(r => setTimeout(r, 200));

      } catch (e) {
        console.error(`[广告拉取] 第${pageNo}页异常:`, e.message);
        break;
      }
    } while (allCampaigns.length < total);

    console.log(`[广告拉取] 广告列表拉取完成，共 ${allCampaigns.length} 条`);
    return allCampaigns;
  }

  /**
   * 拉取单个广告的每日明细
   */
  async fetchDailyPerformance(platformCampaignId, shopId, startDate, endDate) {
    const data = `platformCampaignId=${platformCampaignId}&shopId=${shopId}&startDate=${encodeURIComponent(startDate)}&endDate=${endDate}`;

    try {
      const result = await this.postRequest(
        `${this.baseUrl}/getProductCampaignDailyPerformanceStatDetail`,
        data,
        30000
      );

      if (result.result === 'success') {
        return result.dailyPerformanceList || [];
      }
    } catch (e) {
      console.error(`[广告拉取] 每日明细失败 campaign=${platformCampaignId}:`, e.message);
    }
    return [];
  }

  /**
   * 通过adName匹配platform_item_id
   * 取标题前40个字符做LIKE匹配
   */
  async matchItemId(adName, shopId) {
    // 去掉末尾的 [数字] 标记
    let cleanName = adName.replace(/\s*\[\d+\]\s*$/, '').trim();
    // 取前40个字符
    const prefix = cleanName.substring(0, 40).replace(/'/g, "\\'");

    try {
      const [rows] = await this.pool.query(
        `SELECT DISTINCT platform_item_id FROM eb_order_items 
         WHERE title LIKE ? AND shop_id = ? LIMIT 1`,
        [`${prefix}%`, shopId]
      );
      if (rows.length > 0) return rows[0].platform_item_id;

      // 如果shop_id匹配不到，尝试不限shop_id
      const [rows2] = await this.pool.query(
        `SELECT DISTINCT platform_item_id FROM eb_order_items 
         WHERE title LIKE ? LIMIT 1`,
        [`${prefix}%`]
      );
      return rows2.length > 0 ? rows2[0].platform_item_id : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * 建表
   */
  async ensureTables() {
    // 广告活动表
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS eb_ad_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shopee_ads_campaign_id VARCHAR(20) NOT NULL,
        shop_id VARCHAR(20) NOT NULL,
        platform_campaign_id VARCHAR(20) NOT NULL,
        platform_item_id VARCHAR(30) DEFAULT NULL COMMENT '匹配到的商品ID',
        ad_name TEXT,
        ad_type VARCHAR(20),
        region VARCHAR(10),
        bidding_method VARCHAR(20),
        campaign_placement VARCHAR(20),
        campaign_status VARCHAR(20),
        campaign_budget DECIMAL(15,2) DEFAULT 0,
        start_time VARCHAR(20),
        end_time VARCHAR(20),
        gmt_start_time DATETIME DEFAULT NULL,
        gmt_end_time DATETIME DEFAULT NULL,
        currency VARCHAR(10) DEFAULT 'IDR',
        -- 汇总指标
        impression INT DEFAULT 0,
        clicks INT DEFAULT 0,
        ctr DECIMAL(8,2) DEFAULT 0,
        expense DECIMAL(15,2) DEFAULT 0,
        broad_gmv DECIMAL(15,2) DEFAULT 0,
        broad_order INT DEFAULT 0,
        broad_roi DECIMAL(8,2) DEFAULT 0,
        broad_cir DECIMAL(8,2) DEFAULT 0,
        cr DECIMAL(8,2) DEFAULT 0,
        cpc DECIMAL(15,2) DEFAULT 0,
        direct_gmv DECIMAL(15,2) DEFAULT 0,
        direct_order INT DEFAULT 0,
        direct_roi DECIMAL(8,2) DEFAULT 0,
        direct_cir DECIMAL(8,2) DEFAULT 0,
        direct_cr DECIMAL(8,2) DEFAULT 0,
        -- 时间
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_campaign (platform_campaign_id, shop_id),
        INDEX idx_shop (shop_id),
        INDEX idx_status (campaign_status),
        INDEX idx_item (platform_item_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 广告每日明细表
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS eb_ad_daily (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shop_id VARCHAR(20) NOT NULL,
        platform_campaign_id VARCHAR(20) NOT NULL,
        platform_item_id VARCHAR(30) DEFAULT NULL,
        date DATE NOT NULL,
        region VARCHAR(10),
        currency VARCHAR(10) DEFAULT 'IDR',
        impression INT DEFAULT 0,
        clicks INT DEFAULT 0,
        ctr DECIMAL(8,2) DEFAULT 0,
        expense DECIMAL(15,2) DEFAULT 0,
        expense_cny DECIMAL(15,4) DEFAULT 0,
        broad_gmv DECIMAL(15,2) DEFAULT 0,
        broad_order INT DEFAULT 0,
        broad_roi DECIMAL(8,2) DEFAULT 0,
        broad_cir DECIMAL(8,2) DEFAULT 0,
        cr DECIMAL(8,2) DEFAULT 0,
        cpc DECIMAL(15,2) DEFAULT 0,
        direct_gmv DECIMAL(15,2) DEFAULT 0,
        direct_order INT DEFAULT 0,
        direct_roi DECIMAL(8,2) DEFAULT 0,
        direct_cir DECIMAL(8,2) DEFAULT 0,
        direct_cr DECIMAL(8,2) DEFAULT 0,
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_daily (platform_campaign_id, shop_id, date),
        INDEX idx_date (date),
        INDEX idx_shop_date (shop_id, date),
        INDEX idx_item_date (platform_item_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 拉取日志表
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS eb_ad_fetch_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fetch_type VARCHAR(20) NOT NULL COMMENT 'campaigns/daily',
        status VARCHAR(20) NOT NULL COMMENT 'ongoing/paused/all',
        campaigns_fetched INT DEFAULT 0,
        daily_records_fetched INT DEFAULT 0,
        items_matched INT DEFAULT 0,
        duration VARCHAR(20),
        error TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('[广告拉取] 数据表检查完成');
  }

  /**
   * 保存广告活动到数据库
   */
  async saveCampaign(campaign, platformItemId) {
    const sql = `
      INSERT INTO eb_ad_campaigns (
        shopee_ads_campaign_id, shop_id, platform_campaign_id, platform_item_id,
        ad_name, ad_type, region, bidding_method, campaign_placement,
        campaign_status, campaign_budget, start_time, end_time,
        gmt_start_time, gmt_end_time, currency,
        impression, clicks, ctr, expense,
        broad_gmv, broad_order, broad_roi, broad_cir, cr, cpc,
        direct_gmv, direct_order, direct_roi, direct_cir, direct_cr
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        platform_item_id = VALUES(platform_item_id),
        ad_name = VALUES(ad_name),
        campaign_status = VALUES(campaign_status),
        campaign_budget = VALUES(campaign_budget),
        impression = VALUES(impression), clicks = VALUES(clicks),
        ctr = VALUES(ctr), expense = VALUES(expense),
        broad_gmv = VALUES(broad_gmv), broad_order = VALUES(broad_order),
        broad_roi = VALUES(broad_roi), broad_cir = VALUES(broad_cir),
        cr = VALUES(cr), cpc = VALUES(cpc),
        direct_gmv = VALUES(direct_gmv), direct_order = VALUES(direct_order),
        direct_roi = VALUES(direct_roi), direct_cir = VALUES(direct_cir),
        direct_cr = VALUES(direct_cr),
        updated_at = NOW()
    `;

    const c = campaign;
    await this.pool.query(sql, [
      c.shopeeAdsProductCampaignId, c.shopId, c.platformCampaignId, platformItemId,
      c.adName, c.adType, c.region, c.biddingMethod, c.campaignPlacement,
      c.campaignStatus, parseFloat(c.campaignBudget) || 0,
      c.startTime, c.endTime,
      c.gmtStartTime || null, c.gmtEndTime || null, c.currency || 'IDR',
      parseInt(c.impression) || 0, parseInt(c.clicks) || 0,
      parseFloat(c.ctr) || 0, parseFloat(c.expense) || 0,
      parseFloat(c.broadGmv) || 0, parseInt(c.broadOrder) || 0,
      parseFloat(c.broadRoi) || 0, parseFloat(c.broadCir) || 0,
      parseFloat(c.cr) || 0, parseFloat(c.cpc) || 0,
      parseFloat(c.directGmv) || 0, parseInt(c.directOrder) || 0,
      parseFloat(c.directRoi) || 0, parseFloat(c.directCir) || 0,
      parseFloat(c.directCr) || 0,
    ]);
  }

  /**
   * 保存每日明细到数据库
   */
  async saveDailyRecord(record, platformItemId) {
    const sql = `
      INSERT INTO eb_ad_daily (
        shop_id, platform_campaign_id, platform_item_id, date,
        region, currency, impression, clicks, ctr,
        expense, expense_cny, broad_gmv, broad_order, broad_roi, broad_cir,
        cr, cpc, direct_gmv, direct_order, direct_roi, direct_cir, direct_cr
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        platform_item_id = VALUES(platform_item_id),
        impression = VALUES(impression), clicks = VALUES(clicks),
        ctr = VALUES(ctr), expense = VALUES(expense), expense_cny = VALUES(expense_cny),
        broad_gmv = VALUES(broad_gmv), broad_order = VALUES(broad_order),
        broad_roi = VALUES(broad_roi), broad_cir = VALUES(broad_cir),
        cr = VALUES(cr), cpc = VALUES(cpc),
        direct_gmv = VALUES(direct_gmv), direct_order = VALUES(direct_order),
        direct_roi = VALUES(direct_roi), direct_cir = VALUES(direct_cir),
        direct_cr = VALUES(direct_cr),
        updated_at = NOW()
    `;

    const r = record;
    await this.pool.query(sql, [
      r.shopId, r.platformCampaignId, platformItemId, r.date,
      r.region || 'ID', r.currency || 'IDR',
      parseInt(r.impression) || 0, parseInt(r.clicks) || 0, parseFloat(r.ctr) || 0,
      parseFloat(r.expense) || 0, parseFloat(r.expenseCny) || 0,
      parseFloat(r.broadGmv) || 0, parseInt(r.broadOrder) || 0,
      parseFloat(r.broadRoi) || 0, parseFloat(r.broadCir) || 0,
      parseFloat(r.cr) || 0, parseFloat(r.cpc) || 0,
      parseFloat(r.directGmv) || 0, parseInt(r.directOrder) || 0,
      parseFloat(r.directRoi) || 0, parseFloat(r.directCir) || 0,
      parseFloat(r.directCr) || 0,
    ]);
  }

  /**
   * 主运行入口
   * @param {Object} options
   * @param {string} options.status - ongoing/paused/空
   * @param {boolean} options.fetchDaily - 是否拉取每日明细
   * @param {number} options.dailyDays - 每日明细拉取天数
   */
  async run(options = {}) {
    const startTime = Date.now();
    const {
      status = 'ongoing',
      fetchDaily = true,
      dailyDays = 30,
    } = options;

    // 检查cookie
    const hasCookie = await this.ensureCookie();
    if (!hasCookie) {
      return { success: false, error: 'Cookie未配置，请先设置Cookie' };
    }

    // 建表
    await this.ensureTables();

    let campaignsSaved = 0;
    let dailyRecordsSaved = 0;
    let itemsMatched = 0;

    try {
      // Step 1: 拉取广告列表
      const campaigns = await this.fetchCampaignList(status);

      // Step 2: 逐个处理 - 匹配商品ID + 保存
      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];

        // 匹配商品ID
        const itemId = await this.matchItemId(campaign.adName, campaign.shopId);
        if (itemId) itemsMatched++;

        // 保存广告活动
        try {
          await this.saveCampaign(campaign, itemId);
          campaignsSaved++;
        } catch (e) {
          console.error(`[广告拉取] 保存广告 ${campaign.platformCampaignId} 失败:`, e.message);
        }

        // Step 3: 拉取每日明细
        if (fetchDaily) {
          try {
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - dailyDays * 86400000).toISOString().split('T')[0];
            const gmtStart = campaign.gmtStartTime || `${startDate} 00:00:00`;

            const dailyList = await this.fetchDailyPerformance(
              campaign.platformCampaignId,
              campaign.shopId,
              gmtStart,
              endDate
            );

            for (const record of dailyList) {
              try {
                await this.saveDailyRecord(record, itemId);
                dailyRecordsSaved++;
              } catch (e) {
                // 静默处理单条失败
              }
            }

            // 每个广告之间间隔100ms
            await new Promise(r => setTimeout(r, 100));

          } catch (e) {
            console.error(`[广告拉取] 每日明细 ${campaign.platformCampaignId} 失败:`, e.message);
          }
        }

        // 进度
        if ((i + 1) % 10 === 0 || i === campaigns.length - 1) {
          console.log(`[广告拉取] 进度: ${i + 1}/${campaigns.length}，已匹配商品: ${itemsMatched}，每日明细: ${dailyRecordsSaved}`);
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';

      // 记录日志
      await this.pool.query(
        `INSERT INTO eb_ad_fetch_logs (fetch_type, status, campaigns_fetched, daily_records_fetched, items_matched, duration)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [fetchDaily ? 'full' : 'campaigns', status || 'all', campaignsSaved, dailyRecordsSaved, itemsMatched, duration]
      );

      console.log(`[广告拉取] 完成！广告: ${campaignsSaved}，每日明细: ${dailyRecordsSaved}，商品匹配: ${itemsMatched}，耗时: ${duration}`);

      return {
        success: true,
        campaignsFetched: campaignsSaved,
        dailyRecordsFetched: dailyRecordsSaved,
        itemsMatched,
        totalCampaigns: campaigns.length,
        duration,
      };

    } catch (e) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
      await this.pool.query(
        `INSERT INTO eb_ad_fetch_logs (fetch_type, status, campaigns_fetched, daily_records_fetched, items_matched, duration, error)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['full', status || 'all', campaignsSaved, dailyRecordsSaved, itemsMatched, duration, e.message]
      ).catch(() => {});

      return { success: false, error: e.message, campaignsFetched: campaignsSaved, dailyRecordsFetched: dailyRecordsSaved };
    }
  }

  clearCookies() {
    this.cookieString = null;
  }
}

module.exports = AdsFetcher;

