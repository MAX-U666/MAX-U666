const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gmvmax',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ============ 关键：共享 Token 存储 ============
const tokens = new Map();

// 认证中间件
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || !tokens.has(token)) {
    return res.status(401).json({ error: '未授权' });
  }
  req.user = tokens.get(token);
  next();
};

// 管理员认证中间件
const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
  });
};

// 文件上传配置
const upload = multer({ storage: multer.memoryStorage() });

// ==================== 用户认证 API ====================

// 登录
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = require('crypto').randomBytes(32).toString('hex');
    tokens.set(token, { id: user.id, username: user.username, role: user.role, avatar: user.avatar });

    res.json({ 
      token, 
      user: { id: user.id, username: user.username, role: user.role, avatar: user.avatar }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 登出
app.post('/api/logout', auth, (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  tokens.delete(token);
  res.json({ success: true });
});

// 验证 token
app.get('/api/verify-token', auth, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// 获取用户列表
app.get('/api/users', auth, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, role, avatar FROM users ORDER BY id');
    res.json(users);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加用户
app.post('/api/users', adminAuth, async (req, res) => {
  try {
    const { username, password, role, avatar } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role, avatar) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, role || 'user', avatar || '👤']
    );
    res.json({ id: result.insertId, message: '用户添加成功' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: '用户名已存在' });
    }
    console.error('添加用户错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除用户
app.delete('/api/users/:id', adminAuth, async (req, res) => {
  try {
    if (req.params.id == req.user.id) {
      return res.status(400).json({ error: '不能删除自己' });
    }
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ==================== 产品管理 API ====================

// 获取产品列表
app.get('/api/products', auth, async (req, res) => {
  try {
    const { owner, status } = req.query;
    let sql = `
      SELECT p.*, u.username as owner_name, u.avatar as owner_avatar
      FROM products p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (owner === 'mine') {
      sql += ' AND p.owner_id = ?';
      params.push(req.user.id);
    }
    if (status && status !== 'all') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY p.created_at DESC';
    const [products] = await pool.query(sql, params);
    res.json(products);
  } catch (error) {
    console.error('获取产品列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取产品详情（含每日数据）
app.get('/api/products/:id', auth, async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT p.*, u.username as owner_name, u.avatar as owner_avatar
      FROM products p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (products.length === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }

    const [dailyData] = await pool.query(
      'SELECT * FROM product_daily_data WHERE product_id = ? ORDER BY day_number',
      [req.params.id]
    );

    res.json({ ...products[0], daily_data: dailyData });
  } catch (error) {
    console.error('获取产品详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建产品
app.post('/api/products', auth, async (req, res) => {
  try {
    const { sku, name, price, start_date, target_roi, owner_id } = req.body;
    const [result] = await pool.query(
      'INSERT INTO products (sku, name, price, start_date, target_roi, owner_id, status, current_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [sku, name, price || 0, start_date, target_roi || 3.0, owner_id || req.user.id, '进行中', 1]
    );

    // 初始化 7 天数据
    for (let day = 1; day <= 7; day++) {
      await pool.query(
        'INSERT INTO product_daily_data (product_id, day_number) VALUES (?, ?)',
        [result.insertId, day]
      );
    }

    res.json({ id: result.insertId, message: '产品创建成功' });
  } catch (error) {
    console.error('创建产品错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ==================== 数据上传 API ====================

// 解析上传的 Excel
app.post('/api/upload/parse', auth, upload.single('file'), async (req, res) => {
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    // 标准化字段名
    const products = data.map(row => ({
      product_id: row['商品SKU'] || row['SKU'] || row['product_id'] || row['sku'],
      sessions: row['会话'] || row['sessions'] || 0,
      page_views: row['页面浏览量'] || row['page_views'] || 0,
      units_ordered: row['订购商品数量'] || row['units_ordered'] || 0,
      ordered_revenue: row['已订购商品销售额'] || row['ordered_revenue'] || 0,
      ad_impressions: row['展示量'] || row['impressions'] || 0,
      ad_clicks: row['点击量'] || row['clicks'] || 0,
      ad_spend: row['花费'] || row['spend'] || 0,
      ad_revenue: row['7天总销售额'] || row['ad_revenue'] || 0,
      ad_conversions: row['7天总订单数'] || row['conversions'] || 0,
    }));

    res.json({ success: true, products });
  } catch (error) {
    console.error('解析文件错误:', error);
    res.status(500).json({ success: false, error: '文件解析失败' });
  }
});

// 更新店铺数据
app.post('/api/products/:id/shop-data', auth, async (req, res) => {
  try {
    const { day_number, sessions, page_views, units_ordered, ordered_revenue } = req.body;
    
    await pool.query(`
      UPDATE product_daily_data 
      SET sessions = ?, page_views = ?, units_ordered = ?, ordered_revenue = ?, updated_at = NOW()
      WHERE product_id = ? AND day_number = ?
    `, [sessions, page_views, units_ordered, ordered_revenue, req.params.id, day_number]);

    res.json({ success: true });
  } catch (error) {
    console.error('更新店铺数据错误:', error);
    res.status(500).json({ success: false, error: '更新失败' });
  }
});

// 更新广告数据
app.post('/api/products/:id/ad-data', auth, async (req, res) => {
  try {
    const { day_number, ad_impressions, ad_clicks, ad_spend, ad_revenue, ad_conversions } = req.body;
    
    // 计算 ROI
    const roi = ad_spend > 0 ? (ad_revenue / ad_spend).toFixed(2) : 0;
    
    await pool.query(`
      UPDATE product_daily_data 
      SET ad_impressions = ?, ad_clicks = ?, ad_spend = ?, ad_revenue = ?, ad_conversions = ?, ad_roi = ?, updated_at = NOW()
      WHERE product_id = ? AND day_number = ?
    `, [ad_impressions, ad_clicks, ad_spend, ad_revenue, ad_conversions, roi, req.params.id, day_number]);

    res.json({ success: true, roi });
  } catch (error) {
    console.error('更新广告数据错误:', error);
    res.status(500).json({ success: false, error: '更新失败' });
  }
});

// ==================== 决策执行 API ====================

// 执行决策
app.post('/api/products/:id/execute', auth, async (req, res) => {
  try {
    const { day_number, ai_action, ai_reason, ai_confidence, ai_full_analysis, executor_id } = req.body;
    
    await pool.query(`
      UPDATE product_daily_data 
      SET ai_action = ?, ai_reason = ?, ai_confidence = ?, ai_full_analysis = ?, 
          status = '已执行', executor_id = ?, executed_at = NOW()
      WHERE product_id = ? AND day_number = ?
    `, [ai_action, ai_reason, ai_confidence, ai_full_analysis, executor_id, req.params.id, day_number]);

    // 检查是否需要推进到下一天
    const [product] = await pool.query('SELECT current_day FROM products WHERE id = ?', [req.params.id]);
    if (product[0].current_day == day_number && day_number < 7) {
      await pool.query('UPDATE products SET current_day = ? WHERE id = ?', [day_number + 1, req.params.id]);
    } else if (day_number >= 7) {
      await pool.query('UPDATE products SET status = "已完成" WHERE id = ?', [req.params.id]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('执行决策错误:', error);
    res.status(500).json({ success: false, error: '执行失败' });
  }
});

// 报告异常
app.post('/api/products/:id/abnormal', auth, async (req, res) => {
  try {
    const { day_number, abnormal_reason, executor_id } = req.body;
    
    await pool.query(`
      UPDATE product_daily_data 
      SET status = '异常', abnormal_reason = ?, executor_id = ?, executed_at = NOW()
      WHERE product_id = ? AND day_number = ?
    `, [abnormal_reason, executor_id, req.params.id, day_number]);

    await pool.query('UPDATE products SET status = "已暂停" WHERE id = ?', [req.params.id]);

    res.json({ success: true });
  } catch (error) {
    console.error('报告异常错误:', error);
    res.status(500).json({ success: false, error: '报告失败' });
  }
});

// ==================== 执行中心 API ====================

// 加载执行中心路由（传入共享 tokens）
const executeRoutes = require('./routes/execute')(pool, tokens);
app.use('/api/execute', executeRoutes);

// ==================== 静态文件 ====================

// 截图证据目录
app.use('/evidence', express.static(path.join(__dirname, 'evidence')));

// 前端静态文件
app.use(express.static(path.join(__dirname, 'build')));

// 所有其他请求返回前端（Express 5 兼容写法）
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// ==================== 启动服务器 ====================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  GMV MAX 服务器启动成功');
  console.log(`  端口: ${PORT}`);
  console.log('  模块: 决策工作台 + 执行中心');
  console.log('========================================');
});
