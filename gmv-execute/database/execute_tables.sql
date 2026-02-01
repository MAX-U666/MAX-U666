-- GMV MAX 执行中心 数据库表结构
-- 在 MySQL 中执行

-- ============================================
-- 1. shops - 店铺表
-- ============================================
CREATE TABLE IF NOT EXISTS shops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '店铺名称',
    platform VARCHAR(50) DEFAULT 'shopee' COMMENT '平台',
    site VARCHAR(10) DEFAULT 'id' COMMENT '站点: id/my/th/vn/ph/sg',
    browser_id VARCHAR(100) NOT NULL COMMENT '紫鸟浏览器ID',
    browser_name VARCHAR(100) COMMENT '紫鸟显示名称',
    status ENUM('active', 'inactive', 'error') DEFAULT 'active',
    last_connected_at TIMESTAMP NULL COMMENT '最后连接时间',
    config JSON COMMENT '额外配置',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_browser_id (browser_id)
) COMMENT '店铺管理表';

-- ============================================
-- 2. shop_permissions - 店铺权限表（预留）
-- ============================================
CREATE TABLE IF NOT EXISTS shop_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    shop_id INT NOT NULL,
    can_view BOOLEAN DEFAULT TRUE,
    can_execute BOOLEAN DEFAULT FALSE,
    granted_by INT COMMENT '授权人',
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_shop (user_id, shop_id)
) COMMENT '店铺权限表（预留）';

-- ============================================
-- 3. execution_tasks - 执行任务表
-- ============================================
CREATE TABLE IF NOT EXISTS execution_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_no VARCHAR(50) NOT NULL COMMENT '任务编号',
    shop_id INT NOT NULL,
    action VARCHAR(50) NOT NULL COMMENT '操作类型',
    action_name VARCHAR(100) COMMENT '操作名称',
    payload JSON NOT NULL COMMENT '操作参数',
    
    status ENUM('queued', 'running', 'success', 'failed', 'cancelled') DEFAULT 'queued',
    priority INT DEFAULT 5 COMMENT '优先级 1-10',
    
    result JSON COMMENT '执行结果',
    error_message TEXT COMMENT '错误信息',
    
    evidence_before VARCHAR(500) COMMENT '执行前截图路径',
    evidence_after VARCHAR(500) COMMENT '执行后截图路径',
    evidence_error VARCHAR(500) COMMENT '错误截图路径',
    
    source ENUM('manual', 'ai', 'api') DEFAULT 'manual' COMMENT '来源',
    source_ref VARCHAR(100) COMMENT '来源引用（如决策ID）',
    
    created_by INT COMMENT '创建人',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    duration_ms INT COMMENT '执行耗时(毫秒)',
    
    FOREIGN KEY (shop_id) REFERENCES shops(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_shop_id (shop_id),
    INDEX idx_created_at (created_at)
) COMMENT '执行任务表';

-- ============================================
-- 4. execution_logs - 执行日志表
-- ============================================
CREATE TABLE IF NOT EXISTS execution_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    step INT DEFAULT 1 COMMENT '步骤序号',
    action VARCHAR(100) COMMENT '动作描述',
    status ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    message TEXT,
    screenshot VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES execution_tasks(id) ON DELETE CASCADE,
    INDEX idx_task_id (task_id)
) COMMENT '执行日志表';

-- ============================================
-- 5. action_templates - 操作模板表（可选，用于快捷操作）
-- ============================================
CREATE TABLE IF NOT EXISTS action_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    payload_template JSON,
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
) COMMENT '操作模板表';

-- ============================================
-- 初始化：操作类型枚举（参考用）
-- ============================================
-- action 字段可用值：
-- adjust_budget   - 调整广告预算
-- toggle_ad       - 开/关广告
-- update_title    - 修改商品标题
-- update_price    - 修改商品价格

-- ============================================
-- 生成任务编号的函数
-- ============================================
DELIMITER //
CREATE FUNCTION IF NOT EXISTS generate_task_no() 
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    DECLARE new_no VARCHAR(50);
    SET new_no = CONCAT('TASK-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), '-', FLOOR(RAND() * 1000));
    RETURN new_no;
END//
DELIMITER ;

-- ============================================
-- 触发器：自动生成任务编号
-- ============================================
DELIMITER //
CREATE TRIGGER IF NOT EXISTS before_insert_execution_tasks
BEFORE INSERT ON execution_tasks
FOR EACH ROW
BEGIN
    IF NEW.task_no IS NULL OR NEW.task_no = '' THEN
        SET NEW.task_no = generate_task_no();
    END IF;
END//
DELIMITER ;
