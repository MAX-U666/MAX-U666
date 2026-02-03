-- =============================================
-- EasyBoss 数据表
-- 在 gmvmax 数据库中执行
-- =============================================

USE gmvmax;

-- 广告数据表（核心数据）
CREATE TABLE IF NOT EXISTS eb_ad_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,                          -- 数据日期
  shop_id VARCHAR(50) DEFAULT 'default',       -- 店铺ID
  shop_name VARCHAR(100) DEFAULT '',           -- 店铺名称
  campaign_id VARCHAR(100) NOT NULL,           -- 广告活动ID
  campaign_name VARCHAR(255) DEFAULT '',       -- 广告活动名称
  status VARCHAR(50) DEFAULT 'active',         -- 状态
  
  -- 核心指标
  impressions INT DEFAULT 0,                   -- 曝光/浏览数
  clicks INT DEFAULT 0,                        -- 点击数
  ctr DECIMAL(5,2) DEFAULT 0,                  -- 点击率 %
  orders INT DEFAULT 0,                        -- 订单数
  sales DECIMAL(15,2) DEFAULT 0,               -- 销售金额 (IDR)
  spend DECIMAL(15,2) DEFAULT 0,               -- 花费 (IDR)
  roas DECIMAL(8,2) DEFAULT 0,                 -- ROAS
  
  -- 额外信息
  budget DECIMAL(15,2) DEFAULT 0,              -- 预算
  bid DECIMAL(15,2) DEFAULT 0,                 -- 出价/竞价
  
  -- 元数据
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 联合唯一索引：同一天+同一店铺+同一广告 不重复
  UNIQUE KEY uk_date_shop_campaign (date, shop_id, campaign_id),
  INDEX idx_date (date),
  INDEX idx_shop (shop_id),
  INDEX idx_campaign (campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 拉取日志表
CREATE TABLE IF NOT EXISTS eb_fetch_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  success BOOLEAN DEFAULT FALSE,
  saved_count INT DEFAULT 0,
  error_message TEXT,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_executed (executed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 确认表创建成功
SELECT 'eb_ad_metrics' as table_name, COUNT(*) as row_count FROM eb_ad_metrics
UNION ALL
SELECT 'eb_fetch_logs', COUNT(*) FROM eb_fetch_logs;
