/**
 * EasyBoss 商品数据拉取服务
 * 
 * 接口: searchItemList - 商品列表（含platformItemId、标题、价格、库存等）
 * 
 * 核心功能:
 * 1. 拉取全部商品数据入库
 * 2. 通过标题匹配，关联广告的 platform_item_id
 */

const https = require('https');

class ProductsFetcher {
  constructor(pool) {
    this.pool = pool;
    this.cookieString = null;
    this.baseUrl = 'https://www.easyboss.com/api/platform/shopee/item/item';

    this.allShopIds = [
      '1259862', '1259850', '1259865', '1259869', '1259870',
      '1259878', '1259971', '1259966', '1259948', '1259933',
      '1259925', '1260204', '1260105', '1259842', '1259847',
      '1259853', '1259856', '1259858', '2256701', '2149211',
      '2053413', '2052766', '2035937', '1259950'
    ];
  }

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
    } catch (e) {
      console.error('[商品拉取] 读取cookie失败:', e.message);
    }
    return false;
  }

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
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error(`JSON解析失败: ${body.substring(0, 200)}`)); }
        });
      });

      req.on('error', reject);
      req.setTimeout(timeout, () => { req.destroy(); reject(new Error('请求超时')); });
      req.write(postData);
      req.end();
    });
  }

  buildShopIdsParam(shopIds) {
    return shopIds.map((id, i) => `shopId%5B${i}%5D=${id}`).join('&');
  }

  /**
   * 拉取商品列表（分页）
   * @param {string} status - onsale/soldout/delisted/空(全部)
   */
  async fetchProductList(status = '', pageSize = 50) {
    const allProducts = [];
    let pageNo = 1;
    let total = 0;

    console.log(`[商品拉取] 开始拉取商品列表 (status=${status || '全部'})...`);

    do {
      const shopIdsParam = this.buildShopIdsParam(this.allShopIds);
      let data = `keywordType=title&sortType=desc&sortField=platformCreate&${shopIdsParam}&page=${pageNo}&pageSize=${pageSize}&pageNo=${pageNo}`;
      if (status) data += `&status=${status}`;

      try {
        const result = await this.postRequest(`${this.baseUrl}/searchItemList`, data);

        if (result.result === 'failed' || !result.itemList) {
          console.error(`[商品拉取] 第${pageNo}页失败:`, result.message || result);
          break;
        }

        total = parseInt(result.total) || 0;
        const list = result.itemList || [];
        allProducts.push(...list);

        console.log(`[商品拉取] 第 ${pageNo}/${Math.ceil(total / pageSize)} 页，本页 ${list.length} 条，累计 ${allProducts.length}/${total}`);

        pageNo++;
        await new Promise(r => setTimeout(r, 200));

      } catch (e) {
        console.error(`[商品拉取] 第${pageNo}页异常:`, e.message);
        break;
      }
    } while (allProducts.length < total);

    console.log(`[商品拉取] 商品列表拉取完成，共 ${allProducts.length} 条`);
    return allProducts;
  }

  async ensureTables() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS eb_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        platform_item_id VARCHAR(30) NOT NULL,
        shop_id VARCHAR(20) NOT NULL,
        item_id VARCHAR(20) DEFAULT NULL COMMENT 'EasyBoss内部itemId',
        title TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'onsale',
        platform VARCHAR(20) DEFAULT 'shopee',
        site VARCHAR(10) DEFAULT 'ID',
        currency VARCHAR(10) DEFAULT 'IDR',
        brand_name VARCHAR(100) DEFAULT NULL,
        category VARCHAR(200) DEFAULT NULL,
        original_price DECIMAL(15,2) DEFAULT 0,
        sale_price DECIMAL(15,2) DEFAULT 0,
        min_sku_stock INT DEFAULT 0,
        max_sku_stock INT DEFAULT 0,
        stock INT DEFAULT 0,
        sku_count INT DEFAULT 0,
        sell_cnt INT DEFAULT 0,
        fav_cnt INT DEFAULT 0,
        pv INT DEFAULT 0,
        cmt_cnt INT DEFAULT 0,
        rating_star DECIMAL(3,2) DEFAULT 0,
        pic_url TEXT DEFAULT NULL,
        item_url TEXT DEFAULT NULL,
        weight DECIMAL(10,3) DEFAULT 0,
        gmt_platform_create DATETIME DEFAULT NULL,
        gmt_platform_modified DATETIME DEFAULT NULL,
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_item (platform_item_id, shop_id),
        INDEX idx_shop (shop_id),
        INDEX idx_status (status),
        INDEX idx_title (title(100)),
        INDEX idx_sell (sell_cnt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS eb_product_fetch_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        status_filter VARCHAR(20),
        products_fetched INT DEFAULT 0,
        ads_matched INT DEFAULT 0,
        duration VARCHAR(20),
        error TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('[商品拉取] 数据表检查完成');
  }

  async saveProduct(item) {
    const sql = `
      INSERT INTO eb_products (
        platform_item_id, shop_id, item_id, title, status,
        platform, site, currency, brand_name, category,
        original_price, sale_price, min_sku_stock, max_sku_stock, stock, sku_count,
        sell_cnt, fav_cnt, pv, cmt_cnt, rating_star,
        pic_url, item_url, weight,
        gmt_platform_create, gmt_platform_modified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title), status = VALUES(status),
        brand_name = VALUES(brand_name), category = VALUES(category),
        original_price = VALUES(original_price), sale_price = VALUES(sale_price),
        min_sku_stock = VALUES(min_sku_stock), max_sku_stock = VALUES(max_sku_stock),
        stock = VALUES(stock), sku_count = VALUES(sku_count),
        sell_cnt = VALUES(sell_cnt), fav_cnt = VALUES(fav_cnt),
        pv = VALUES(pv), cmt_cnt = VALUES(cmt_cnt), rating_star = VALUES(rating_star),
        pic_url = VALUES(pic_url), item_url = VALUES(item_url),
        weight = VALUES(weight),
        gmt_platform_modified = VALUES(gmt_platform_modified),
        updated_at = NOW()
    `;

    const p = item;
    await this.pool.query(sql, [
      p.platformItemId, p.shopId, p.itemId || null,
      p.title, p.status || 'onsale',
      p.platform || 'shopee', p.site || 'ID', p.currency || 'IDR',
      p.brandName || null, p.breadcrumb || null,
      parseFloat(p.originalPrice) || 0,
      parseFloat(p.salePrice || p.minSkuSalePrice || p.maxSkuSalePrice) || 0,
      parseInt(p.minSkuStock) || 0, parseInt(p.maxSkuStock) || 0,
      parseInt(p.stock) || 0, parseInt(p.skuCount) || 0,
      parseInt(p.sellCnt) || 0, parseInt(p.favCnt) || 0,
      parseInt(p.pv) || 0, parseInt(p.cmtCnt) || 0,
      parseFloat(p.ratingStar) || 0,
      p.picUrl || null, p.itemUrl || null,
      parseFloat(p.weight) || 0,
      p.gmtPlatformCreate || null, p.gmtPlatformModified || null,
    ]);
  }

  /**
   * 通过商品标题匹配广告的platform_item_id
   * 广告adName = 商品title + " [SKU数量]"
   */
  async matchAdsToProducts() {
    console.log('[商品拉取] 开始匹配广告 → 商品...');

    // 获取所有未匹配的广告
    const [ads] = await this.pool.query(
      `SELECT platform_campaign_id, shop_id, ad_name FROM eb_ad_campaigns WHERE 1=1`
    );

    let matched = 0;
    for (const ad of ads) {
      // 去掉广告标题末尾的 [数字]
      const cleanAdName = ad.ad_name.replace(/\s*\[\d+\]\s*$/, '').trim();

      // 精确匹配：同shop_id下，商品title = 清理后的广告标题
      const [products] = await this.pool.query(
        `SELECT platform_item_id FROM eb_products 
         WHERE shop_id = ? AND title = ? LIMIT 1`,
        [ad.shop_id, cleanAdName]
      );

      if (products.length > 0) {
        await this.pool.query(
          `UPDATE eb_ad_campaigns SET platform_item_id = ? WHERE platform_campaign_id = ? AND shop_id = ?`,
          [products[0].platform_item_id, ad.platform_campaign_id, ad.shop_id]
        );
        // 同时更新每日明细表
        await this.pool.query(
          `UPDATE eb_ad_daily SET platform_item_id = ? WHERE platform_campaign_id = ? AND shop_id = ?`,
          [products[0].platform_item_id, ad.platform_campaign_id, ad.shop_id]
        );
        matched++;
      }
    }

    // 第二轮：对未匹配的，尝试模糊匹配（标题前60字符 + 同shop_id）
    const [unmatched] = await this.pool.query(
      `SELECT platform_campaign_id, shop_id, ad_name FROM eb_ad_campaigns WHERE platform_item_id IS NULL`
    );

    for (const ad of unmatched) {
      const cleanAdName = ad.ad_name.replace(/\s*\[\d+\]\s*$/, '').trim();
      const prefix = cleanAdName.substring(0, 60);

      const [products] = await this.pool.query(
        `SELECT platform_item_id FROM eb_products 
         WHERE shop_id = ? AND title LIKE ? LIMIT 1`,
        [ad.shop_id, `${prefix}%`]
      );

      if (products.length > 0) {
        await this.pool.query(
          `UPDATE eb_ad_campaigns SET platform_item_id = ? WHERE platform_campaign_id = ? AND shop_id = ?`,
          [products[0].platform_item_id, ad.platform_campaign_id, ad.shop_id]
        );
        await this.pool.query(
          `UPDATE eb_ad_daily SET platform_item_id = ? WHERE platform_campaign_id = ? AND shop_id = ?`,
          [products[0].platform_item_id, ad.platform_campaign_id, ad.shop_id]
        );
        matched++;
      }
    }

    const [stillUnmatched] = await this.pool.query(
      `SELECT COUNT(*) as cnt FROM eb_ad_campaigns WHERE platform_item_id IS NULL`
    );

    console.log(`[商品拉取] 广告匹配完成: ${matched} 个匹配成功, ${stillUnmatched[0].cnt} 个未匹配`);
    return matched;
  }

  /**
   * 主运行入口
   */
  async run(options = {}) {
    const startTime = Date.now();
    const { status = '', matchAds = true } = options;

    const hasCookie = await this.ensureCookie();
    if (!hasCookie) {
      return { success: false, error: 'Cookie未配置' };
    }

    await this.ensureTables();

    let productsSaved = 0;
    let adsMatched = 0;

    try {
      // Step 1: 拉取商品列表
      const products = await this.fetchProductList(status);

      // Step 2: 保存到数据库
      for (let i = 0; i < products.length; i++) {
        try {
          await this.saveProduct(products[i]);
          productsSaved++;
        } catch (e) {
          // 静默处理单条失败
        }

        if ((i + 1) % 100 === 0 || i === products.length - 1) {
          console.log(`[商品拉取] 保存进度: ${i + 1}/${products.length}`);
        }
      }

      // Step 3: 匹配广告
      if (matchAds) {
        adsMatched = await this.matchAdsToProducts();
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';

      await this.pool.query(
        `INSERT INTO eb_product_fetch_logs (status_filter, products_fetched, ads_matched, duration)
         VALUES (?, ?, ?, ?)`,
        [status || 'all', productsSaved, adsMatched, duration]
      );

      console.log(`[商品拉取] 完成！商品: ${productsSaved}，广告匹配: ${adsMatched}，耗时: ${duration}`);

      return {
        success: true,
        productsFetched: productsSaved,
        totalProducts: products.length,
        adsMatched,
        duration,
      };

    } catch (e) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
      await this.pool.query(
        `INSERT INTO eb_product_fetch_logs (status_filter, products_fetched, ads_matched, duration, error)
         VALUES (?, ?, ?, ?, ?)`,
        [status || 'all', productsSaved, adsMatched, duration, e.message]
      ).catch(() => {});

      return { success: false, error: e.message, productsFetched: productsSaved };
    }
  }

  clearCookies() {
    this.cookieString = null;
  }
}

module.exports = ProductsFetcher;
