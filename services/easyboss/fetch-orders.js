/**
 * EasyBoss 订单数据抓取服务
 * 使用 HTTP API 自动登录，Cookie 过期自动刷新
 * 
 * API: POST https://www.easyboss.com/api/order/package/searchOrderPackageList
 * 
 * [2026-02-06] 修复：ensureLogin每次从文件读取最新Cookie，不再使用内存缓存
 */

const EasyBossHttpAuth = require('./http-auth');

class EasyBossOrderFetcher {
  constructor(pool) {
    this.pool = pool;
    this.baseUrl = 'https://www.easyboss.com';
    this.apiPath = '/api/order/package/searchOrderPackageList';
    this.cookieString = null;
    this.pageSize = 50;
    this.loginRetried = false;
    this.httpAuth = new EasyBossHttpAuth(pool);
  }

  /**
   * 获取Cookie（每次从文件/数据库读取最新，不使用内存缓存）
   */
  async ensureLogin() {
    // 每次都从文件/数据库读取最新cookie，不使用内存缓存
    const saved = await this.httpAuth.getCookie();

    if (saved && saved.cookieString) {
      this.cookieString = saved.cookieString;
      console.log(`[订单抓取] 使用最新Cookie (${this.cookieString.length} 字符)`);
      return true;
    }

    // 没有配置cookie，自动登录
    console.log('[订单抓取] 未找到Cookie配置，执行HTTP登录...');
    return await this.autoLogin();
  }

  /**
   * HTTP API 自动登录获取Cookie
   */
  async autoLogin() {
    try {
      const result = await this.httpAuth.loginAndSave();
      
      if (!result.success) {
        console.error('[订单抓取] HTTP登录失败:', result.error);
        throw new Error('登录失败: ' + result.error);
      }

      this.cookieString = result.cookieString;
      console.log(`[订单抓取] ✅ HTTP登录成功，Cookie已保存 (${this.cookieString.length} 字符)`);
      
      return true;
    } catch (err) {
      console.error('[订单抓取] 登录异常:', err.message);
      throw err;
    }
  }

  /**
   * Cookie失效时重新登录
   */
  async refreshLogin() {
    console.log('[订单抓取] Cookie失效，执行HTTP重新登录...');
    this.cookieString = null;
    this.loginRetried = true;
    
    await this.autoLogin();
    return true;
  }

  /**
   * 构建cookie字符串
   */
  getCookieString() {
    return this.cookieString || '';
  }

  /**
   * 调用订单列表API
   */
  async fetchOrderPage(params = {}) {
    const defaultParams = {
      pageSize: this.pageSize,
      page: 1,
      purchaseSelectType: 'purchaseInfo',
      processTab: 'all',
      appPackageTab: 'all',
      sortField: 'gmtOrderStart',
      sortType: 'desc',
    };

    const mergedParams = { ...defaultParams, ...params };
    
    const formBody = Object.entries(mergedParams)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const url = `${this.baseUrl}${this.apiPath}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': this.getCookieString(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://www.easyboss.com/order/list',
      },
      body: formBody,
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // 检测登录失效 → 自动刷新
    if (data.result === 'fail' && (data.code === 50001 || data.reason?.includes('登录失效'))) {
      if (!this.loginRetried) {
        console.log('[订单抓取] 检测到登录失效，自动刷新Cookie...');
        await this.refreshLogin();
        // 重试请求
        return await this.fetchOrderPage(params);
      } else {
        throw new Error('登录失效且重试失败，请检查账号密码');
      }
    }
    
    if (data.result !== 'success') {
      throw new Error(`API返回错误: ${JSON.stringify(data)}`);
    }

    // 请求成功，重置重试标记
    this.loginRetried = false;
    return data;
  }

  /**
   * 拉取指定时间段的所有订单（自动翻页）
   */
  async fetchAllOrders(dateFrom, dateTo, extraParams = {}) {
    await this.ensureLogin();
    
    const allOrders = [];
    let page = 1;
    let totalPages = 1;
    let total = 0;

    const params = {
      gmtOrderStartFrom: dateFrom,
      gmtOrderStartTo: dateTo,
      processTab: 'all',
      appPackageTab: 'all',
      ...extraParams,
    };

    console.log(`[订单抓取] 开始拉取 ${dateFrom} ~ ${dateTo}`);

    while (page <= totalPages) {
      params.page = page;
      
      const data = await this.fetchOrderPage(params);
      
      total = parseInt(data.total) || 0;
      totalPages = Math.ceil(total / this.pageSize);
      
      if (data.packageList && data.packageList.length > 0) {
        allOrders.push(...data.packageList);
      }

      console.log(`[订单抓取] 第 ${page}/${totalPages} 页，本页 ${data.packageList?.length || 0} 条，累计 ${allOrders.length}/${total}`);

      page++;
      
      if (page <= totalPages) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`[订单抓取] 完成，共 ${allOrders.length} 条订单`);
    return { orders: allOrders, total };
  }

  /**
   * 解析并保存订单到数据库
   */
  async saveOrders(orders) {
    if (!orders || orders.length === 0) return { saved: 0, items: 0 };

    let savedCount = 0;
    let itemsCount = 0;

    for (const pkg of orders) {
      try {
        await this.upsertOrder(pkg);
        savedCount++;

        if (pkg.items) {
          const items = Object.values(pkg.items);
          for (const item of items) {
            await this.upsertOrderItem(item, pkg.opOrderPackageId);
            itemsCount++;
          }
        }
      } catch (err) {
        console.error(`[订单抓取] 保存订单 ${pkg.opOrderPackageId} 失败:`, err.message);
      }
    }

    console.log(`[订单抓取] 入库完成: ${savedCount} 订单, ${itemsCount} 商品明细`);
    return { saved: savedCount, items: itemsCount };
  }

  /**
   * 插入/更新订单主记录
   */
  async upsertOrder(pkg) {
    const orderInfo = pkg.orderInfo || {};
    const amountDetail = pkg.orderPackageAmountDetail || {};
    const incomeDetail = amountDetail.incomeDetail || {};
    const consignee = pkg.consigneeInfo || {};

    const sql = `
      INSERT INTO eb_orders (
        op_order_package_id, op_order_id, platform, platform_order_sn,
        platform_package_id, site, shop_id, shop_name, platform_shop_id,
        platform_shop_name, platform_order_status, app_package_status,
        app_package_status_text, app_package_tab,
        product_amount, order_amount, discount_amount, pay_amount,
        escrow_amount, estimated_shipping_fee, actual_shipping_cost,
        commission_fee, service_fee, seller_transaction_fee,
        exchange_rate, account_currency_product_amount, account_currency_order_amount,
        order_profit, cost_profit_ratio, sales_profit_ratio,
        buyer_username, buyer_country, buyer_province,
        payment_method, is_cod, currency, voucher_code,
        logistics_company, logistics_no, delivery_option, logistics_method,
        item_quantity, item_variety, cancel_by, cancel_reason,
        gmt_order_start, gmt_pay, gmt_create, gmt_delivery,
        gmt_finish, gmt_modified, gmt_last_delivery,
        fulfillment_type, warehouse_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        platform_order_status = VALUES(platform_order_status),
        app_package_status = VALUES(app_package_status),
        app_package_status_text = VALUES(app_package_status_text),
        app_package_tab = VALUES(app_package_tab),
        product_amount = VALUES(product_amount),
        order_amount = VALUES(order_amount),
        discount_amount = VALUES(discount_amount),
        pay_amount = VALUES(pay_amount),
        escrow_amount = VALUES(escrow_amount),
        commission_fee = VALUES(commission_fee),
        service_fee = VALUES(service_fee),
        seller_transaction_fee = VALUES(seller_transaction_fee),
        order_profit = VALUES(order_profit),
        logistics_no = VALUES(logistics_no),
        cancel_by = VALUES(cancel_by),
        cancel_reason = VALUES(cancel_reason),
        gmt_delivery = VALUES(gmt_delivery),
        gmt_finish = VALUES(gmt_finish),
        gmt_modified = VALUES(gmt_modified),
        updated_at = CURRENT_TIMESTAMP
    `;

    const values = [
      pkg.opOrderPackageId,
      pkg.opOrderId,
      pkg.platform || 'shopee',
      orderInfo.platformOrderSn || pkg.platformOrderSn,
      pkg.platformPackageId,
      pkg.site || 'ID',
      pkg.shopId,
      pkg.shopName,
      pkg.platformShopId,
      pkg.platformShopName,
      orderInfo.platformOrderStatus,
      pkg.appPackageStatus,
      pkg.appPackageStatusText,
      pkg.appPackageTab,
      parseFloat(amountDetail.productAmount) || parseFloat(orderInfo.productAmount) || 0,
      parseFloat(amountDetail.orderAmount) || parseFloat(orderInfo.orderAmount) || 0,
      parseFloat(amountDetail.discountAmount) || parseFloat(orderInfo.discountAmount) || 0,
      parseFloat(amountDetail.payAmount) || parseFloat(orderInfo.payAmount) || 0,
      parseFloat(amountDetail.escrowAmount) || parseFloat(orderInfo.escrowAmount) || 0,
      parseFloat(amountDetail.estimatedShippingFee) || parseFloat(orderInfo.estimatedShippingFee) || 0,
      parseFloat(amountDetail.actualShippingCost) || 0,
      parseFloat(incomeDetail.commissionFee) || 0,
      parseFloat(incomeDetail.serviceFee) || 0,
      parseFloat(incomeDetail.sellerTransactionFee) || 0,
      parseFloat(amountDetail.exchangeRate) || parseFloat(orderInfo.exchangeRate) || 0,
      parseFloat(amountDetail.accountCurrencyProductAmount) || 0,
      parseFloat(amountDetail.accountCurrencyOrderAmount) || 0,
      parseFloat(amountDetail.orderProfit) || 0,
      amountDetail.costProfitRatio || '0%',
      amountDetail.salesProfitRatio || '0%',
      orderInfo.buyerUsername,
      orderInfo.buyerCountry || 'ID',
      orderInfo.buyerProvince,
      orderInfo.paymentMethod,
      orderInfo.isCod || '0',
      orderInfo.currency || 'IDR',
      incomeDetail.voucherCode,
      pkg.logisticsCompany || consignee.logisticsCompany,
      pkg.logisticsNo || consignee.logisticsNo,
      pkg.deliveryOption,
      pkg.logisticsMethod,
      parseInt(pkg.itemQuantity) || 0,
      pkg.itemVariety,
      orderInfo.cancelBy,
      orderInfo.cancelReason,
      orderInfo.gmtOrderStart || null,
      orderInfo.gmtPay || null,
      pkg.gmtCreate || null,
      pkg.gmtDelivery || null,
      pkg.gmtFinish || null,
      pkg.gmtModified || null,
      pkg.gmtLastDelivery || null,
      pkg.fulfillmentType,
      pkg.warehouseName || null,
    ];

    await this.pool.query(sql, values);
  }

  /**
   * 插入/更新商品明细
   */
  async upsertOrderItem(item, opOrderPackageId) {
    const sql = `
      INSERT INTO eb_order_items (
        op_order_package_id, op_order_id, op_order_item_id,
        platform_item_id, platform_sku_id, goods_id, goods_sku_id,
        goods_sku_outer_id, title, goods_name, sku_sub_name,
        original_price, discounted_price, discount_amount,
        account_currency_original_price, account_currency_discounted_price,
        quantity, pic_url, logo_url,
        available_stock_num, locked_stock_num,
        warehouse_id, warehouse_name,
        url, platform_item_edit_url,
        weight, goods_mode, shop_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        goods_name = VALUES(goods_name),
        original_price = VALUES(original_price),
        discounted_price = VALUES(discounted_price),
        discount_amount = VALUES(discount_amount),
        quantity = VALUES(quantity),
        available_stock_num = VALUES(available_stock_num),
        locked_stock_num = VALUES(locked_stock_num),
        updated_at = CURRENT_TIMESTAMP
    `;

    const values = [
      opOrderPackageId,
      item.opOrderId,
      item.opOrderItemId,
      item.platformItemId,
      item.platformSkuId,
      item.goodsId,
      item.goodsSkuId,
      item.goodsSkuOuterId,
      item.title,
      item.goodsName || (item.selfGoodsSkuInfo && item.selfGoodsSkuInfo.goodsName),
      item.skuSubName,
      parseFloat(item.originalPrice) || 0,
      parseFloat(item.discountedPrice) || 0,
      parseFloat(item.discountAmount) || 0,
      parseFloat(item.accountCurrencyOriginalPrice) || 0,
      parseFloat(item.accountCurrencyDiscountedPrice) || 0,
      parseInt(item.quantity) || parseInt(item.itemQuantity) || 0,
      item.picUrl,
      item.logoUrl,
      parseInt(item.availableStockNum) || 0,
      parseInt(item.lockedStockNum) || 0,
      item.warehouseId,
      item.warehouseName,
      item.url,
      item.platformItemEditUrl,
      parseFloat(item.weight) || 0,
      item.goodsMode,
      item.shopId,
    ];

    await this.pool.query(sql, values);
  }

  /**
   * 主入口：拉取并保存订单
   */
  async run(options = {}) {
    const startTime = Date.now();
    
    let dateFrom, dateTo;
    
    if (options.dateFrom && options.dateTo) {
      dateFrom = options.dateFrom;
      dateTo = options.dateTo;
    } else {
      const days = options.days || 7;
      const now = new Date();
      const offset = 8 * 60 * 60 * 1000;
      const nowLocal = new Date(now.getTime() + offset);
      const fromLocal = new Date(nowLocal);
      fromLocal.setDate(fromLocal.getDate() - days);
      
      const pad = (n) => String(n).padStart(2, '0');
      dateFrom = `${fromLocal.getUTCFullYear()}-${pad(fromLocal.getUTCMonth()+1)}-${pad(fromLocal.getUTCDate())} 00:00:00`;
      dateTo = `${nowLocal.getUTCFullYear()}-${pad(nowLocal.getUTCMonth()+1)}-${pad(nowLocal.getUTCDate())} 23:59:59`;
    }

    const extraParams = {};
    if (options.status && options.status !== 'all') {
      extraParams.appPackageTab = options.status;
    }

    try {
      const { orders, total } = await this.fetchAllOrders(dateFrom, dateTo, extraParams);
      const saveResult = await this.saveOrders(orders);
      const duration = Date.now() - startTime;
      
      await this.logFetch({
        status: 'success',
        ordersFetched: saveResult.saved,
        itemsFetched: saveResult.items,
        totalAvailable: total,
        pagesFetched: Math.ceil(orders.length / this.pageSize),
        dateFrom,
        dateTo,
        durationMs: duration,
      });

      return {
        success: true,
        ordersFetched: saveResult.saved,
        itemsFetched: saveResult.items,
        totalAvailable: total,
        dateRange: { from: dateFrom, to: dateTo },
        duration: `${(duration / 1000).toFixed(1)}s`,
      };
    } catch (err) {
      const duration = Date.now() - startTime;
      
      await this.logFetch({
        status: 'failed',
        dateFrom,
        dateTo,
        durationMs: duration,
        errorMessage: err.message,
      });

      return {
        success: false,
        error: err.message,
        dateRange: { from: dateFrom, to: dateTo },
        duration: `${(duration / 1000).toFixed(1)}s`,
      };
    }
  }

  /**
   * 记录拉取日志
   */
  async logFetch(data) {
    try {
      await this.pool.query(
        `INSERT INTO eb_order_fetch_logs 
         (fetch_type, status, orders_fetched, items_fetched, total_available, pages_fetched, date_from, date_to, duration_ms, error_message) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'orders',
          data.status,
          data.ordersFetched || 0,
          data.itemsFetched || 0,
          data.totalAvailable || 0,
          data.pagesFetched || 0,
          data.dateFrom,
          data.dateTo,
          data.durationMs || 0,
          data.errorMessage || null,
        ]
      );
    } catch (err) {
      console.error('[订单抓取] 写日志失败:', err.message);
    }
  }

  clearCookies() {
    this.cookieString = null;
  }
}

module.exports = EasyBossOrderFetcher;
