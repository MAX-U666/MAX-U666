-- ============================================
-- EasyBoss 订单数据表
-- 基于 searchOrderPackageList API 返回结构
-- ============================================

-- 订单主表（package级别，一个订单可能有多个package）
CREATE TABLE IF NOT EXISTS eb_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- EasyBoss 内部ID
  op_order_package_id VARCHAR(20) NOT NULL,
  op_order_id VARCHAR(20) NOT NULL,
  
  -- 平台信息
  platform VARCHAR(20) DEFAULT 'shopee',
  platform_order_sn VARCHAR(50) NOT NULL COMMENT '平台订单号如260204RBPBJ6UE',
  platform_package_id VARCHAR(50) DEFAULT NULL,
  site VARCHAR(10) DEFAULT 'ID' COMMENT '站点:ID=印尼',
  
  -- 店铺信息
  shop_id VARCHAR(20) NOT NULL,
  shop_name VARCHAR(100) DEFAULT NULL,
  platform_shop_id VARCHAR(20) DEFAULT NULL,
  platform_shop_name VARCHAR(200) DEFAULT NULL,
  
  -- 订单状态
  platform_order_status VARCHAR(30) DEFAULT NULL COMMENT 'CANCELLED/COMPLETED/IN_CANCEL等',
  app_package_status VARCHAR(30) DEFAULT NULL COMMENT 'cancelled/shipped/closed等',
  app_package_status_text VARCHAR(50) DEFAULT NULL COMMENT '已关闭/已发货等',
  app_package_tab VARCHAR(30) DEFAULT NULL COMMENT 'closed/shipped/waitArrange等',
  
  -- 金额信息（IDR）
  product_amount DECIMAL(15,2) DEFAULT 0 COMMENT '商品总额',
  order_amount DECIMAL(15,2) DEFAULT 0 COMMENT '订单金额（折后）',
  discount_amount DECIMAL(15,2) DEFAULT 0 COMMENT '折扣金额',
  pay_amount DECIMAL(15,2) DEFAULT 0 COMMENT '实付金额',
  escrow_amount DECIMAL(15,2) DEFAULT 0 COMMENT '结算金额',
  estimated_shipping_fee DECIMAL(15,2) DEFAULT 0 COMMENT '预估运费',
  actual_shipping_cost DECIMAL(15,2) DEFAULT 0 COMMENT '实际运费',
  commission_fee DECIMAL(15,2) DEFAULT 0 COMMENT '佣金',
  service_fee DECIMAL(15,2) DEFAULT 0 COMMENT '服务费',
  seller_transaction_fee DECIMAL(15,2) DEFAULT 0 COMMENT '交易手续费',
  
  -- 换算金额（CNY）
  exchange_rate DECIMAL(15,6) DEFAULT 0 COMMENT 'IDR兑换率',
  account_currency_product_amount DECIMAL(15,4) DEFAULT 0 COMMENT 'CNY商品额',
  account_currency_order_amount DECIMAL(15,4) DEFAULT 0 COMMENT 'CNY订单额',
  
  -- 利润信息
  order_profit DECIMAL(15,2) DEFAULT 0,
  cost_profit_ratio VARCHAR(20) DEFAULT '0%',
  sales_profit_ratio VARCHAR(20) DEFAULT '0%',
  
  -- 买家信息
  buyer_username VARCHAR(100) DEFAULT NULL,
  buyer_country VARCHAR(10) DEFAULT 'ID',
  buyer_province VARCHAR(50) DEFAULT NULL,
  
  -- 支付信息
  payment_method VARCHAR(50) DEFAULT NULL COMMENT 'ShopeePay Balance/COD等',
  is_cod VARCHAR(5) DEFAULT '0',
  currency VARCHAR(10) DEFAULT 'IDR',
  voucher_code VARCHAR(50) DEFAULT NULL,
  
  -- 物流信息
  logistics_company VARCHAR(100) DEFAULT NULL COMMENT 'SiCepat REG等',
  logistics_no VARCHAR(100) DEFAULT NULL COMMENT '物流单号',
  delivery_option VARCHAR(30) DEFAULT NULL COMMENT 'dropOff/pickup',
  logistics_method VARCHAR(50) DEFAULT NULL,
  
  -- 商品统计
  item_quantity INT DEFAULT 0 COMMENT '商品数量',
  item_variety VARCHAR(20) DEFAULT NULL COMMENT 'sku_item等',
  
  -- 取消信息
  cancel_by VARCHAR(20) DEFAULT NULL COMMENT 'buyer/seller/system',
  cancel_reason VARCHAR(500) DEFAULT NULL,
  
  -- 时间信息
  gmt_order_start DATETIME DEFAULT NULL COMMENT '下单时间',
  gmt_pay DATETIME DEFAULT NULL COMMENT '付款时间',
  gmt_create DATETIME DEFAULT NULL COMMENT '创建时间',
  gmt_delivery DATETIME DEFAULT NULL COMMENT '发货时间',
  gmt_finish DATETIME DEFAULT NULL COMMENT '完成时间',
  gmt_modified DATETIME DEFAULT NULL COMMENT '最后修改',
  gmt_last_delivery DATETIME DEFAULT NULL COMMENT '最迟发货时间',
  
  -- 其他
  fulfillment_type VARCHAR(30) DEFAULT NULL COMMENT 'platformFulfillment等',
  warehouse_name VARCHAR(100) DEFAULT NULL,
  
  -- 系统字段
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '抓取时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_package_id (op_order_package_id),
  INDEX idx_platform_order_sn (platform_order_sn),
  INDEX idx_shop_id (shop_id),
  INDEX idx_order_status (platform_order_status),
  INDEX idx_app_status (app_package_status),
  INDEX idx_gmt_order_start (gmt_order_start),
  INDEX idx_gmt_create (gmt_create),
  INDEX idx_fetched_at (fetched_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='EasyBoss订单主表';


-- 订单商品明细表
CREATE TABLE IF NOT EXISTS eb_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- 关联ID
  op_order_package_id VARCHAR(20) NOT NULL,
  op_order_id VARCHAR(20) NOT NULL,
  op_order_item_id VARCHAR(20) NOT NULL,
  
  -- 商品信息
  platform_item_id VARCHAR(30) DEFAULT NULL COMMENT '平台商品ID',
  platform_sku_id VARCHAR(30) DEFAULT NULL COMMENT '平台SKU ID',
  goods_id VARCHAR(20) DEFAULT NULL COMMENT 'EasyBoss商品ID',
  goods_sku_id VARCHAR(20) DEFAULT NULL COMMENT 'EasyBoss SKU ID',
  goods_sku_outer_id VARCHAR(100) DEFAULT NULL COMMENT '商品编码',
  
  -- 商品名称
  title VARCHAR(500) DEFAULT NULL COMMENT '平台标题（印尼语）',
  goods_name VARCHAR(200) DEFAULT NULL COMMENT 'EasyBoss商品名（中文）',
  sku_sub_name VARCHAR(200) DEFAULT NULL COMMENT 'SKU规格如2.0 Upgrade 500ML',
  
  -- 价格
  original_price DECIMAL(15,2) DEFAULT 0 COMMENT '原价',
  discounted_price DECIMAL(15,2) DEFAULT 0 COMMENT '折后价',
  discount_amount DECIMAL(15,2) DEFAULT 0 COMMENT '折扣金额',
  account_currency_original_price DECIMAL(15,4) DEFAULT 0 COMMENT 'CNY原价',
  account_currency_discounted_price DECIMAL(15,4) DEFAULT 0 COMMENT 'CNY折后价',
  
  -- 数量
  quantity INT DEFAULT 0,
  
  -- 图片
  pic_url VARCHAR(500) DEFAULT NULL COMMENT '商品图片',
  logo_url VARCHAR(500) DEFAULT NULL COMMENT 'EasyBoss图片',
  
  -- 库存
  available_stock_num INT DEFAULT 0,
  locked_stock_num INT DEFAULT 0,
  
  -- 仓库
  warehouse_id VARCHAR(20) DEFAULT NULL,
  warehouse_name VARCHAR(100) DEFAULT NULL,
  
  -- 商品链接
  url VARCHAR(500) DEFAULT NULL COMMENT 'Shopee商品链接',
  platform_item_edit_url VARCHAR(500) DEFAULT NULL,
  
  -- 其他
  weight DECIMAL(10,2) DEFAULT 0 COMMENT '重量kg',
  goods_mode VARCHAR(20) DEFAULT NULL COMMENT 'single/bundle',
  shop_id VARCHAR(20) DEFAULT NULL,
  
  -- 系统字段
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_item_id (op_order_item_id),
  INDEX idx_package_id (op_order_package_id),
  INDEX idx_order_id (op_order_id),
  INDEX idx_goods_id (goods_id),
  INDEX idx_goods_sku_id (goods_sku_id),
  INDEX idx_platform_item_id (platform_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='EasyBoss订单商品明细';


-- 订单拉取日志
CREATE TABLE IF NOT EXISTS eb_order_fetch_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fetch_type VARCHAR(20) DEFAULT 'orders' COMMENT 'orders',
  status ENUM('success', 'failed') NOT NULL,
  orders_fetched INT DEFAULT 0 COMMENT '获取订单数',
  items_fetched INT DEFAULT 0 COMMENT '获取商品数',
  total_available INT DEFAULT 0 COMMENT 'API返回total',
  pages_fetched INT DEFAULT 0 COMMENT '拉取页数',
  date_from DATETIME DEFAULT NULL,
  date_to DATETIME DEFAULT NULL,
  duration_ms INT DEFAULT 0,
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单拉取日志';
