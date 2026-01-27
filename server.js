const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: '/tmp/uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gmvmax',
  socketPath: '/var/run/mysqld/mysqld.sock'
});

// 获取所有用户
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取所有产品（带筛选）
app.get('/api/products', async (req, res) => {
  try {
    const { owner_id, status } = req.query;
    let sql = `SELECT p.*, u.name as owner_name, u.avatar as owner_avatar 
               FROM products p 
               LEFT JOIN users u ON p.owner_id = u.id 
               WHERE 1=1`;
    const params = [];
    
    if (owner_id) {
      sql += ' AND p.owner_id = ?';
      params.push(owner_id);
    }
    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY p.created_at DESC';
    
    const [rows] = await pool.query(sql, params);
    
    // 计算每个产品的当前Day
    const today = new Date();
    rows.forEach(p => {
      const startDate = new Date(p.start_date);
      const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
      p.current_day = Math.min(Math.max(diffDays, 1), 7);
    });
    
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个产品详情（含7天数据）
app.get('/api/products/:id', async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT p.*, u.name as owner_name, u.avatar as owner_avatar 
       FROM products p 
       LEFT JOIN users u ON p.owner_id = u.id 
       WHERE p.id = ?`, 
      [req.params.id]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }
    
    const product = products[0];
    
    // 计算当前Day
    const today = new Date();
    const startDate = new Date(product.start_date);
    const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    product.current_day = Math.min(Math.max(diffDays, 1), 7);
    
    // 获取7天数据
    const [dailyData] = await pool.query(
      'SELECT * FROM daily_data WHERE product_id = ? ORDER BY day_number',
      [req.params.id]
    );
    product.daily_data = dailyData;
    
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 新建产品
app.post('/api/products', async (req, res) => {
  try {
    const { sku, name, price, owner_id, start_date, target_roi } = req.body;
    
    // 检查SKU是否已存在（同一开始日期）
    const [existing] = await pool.query(
      'SELECT id FROM products WHERE sku = ? AND start_date = ?',
      [sku, start_date]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: '该产品在此日期已存在' });
    }
    
    // 创建产品
    const [result] = await pool.query(
      `INSERT INTO products (sku, name, price, owner_id, start_date, target_roi) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sku, name, price || 0, owner_id, start_date, target_roi || 3.0]
    );
    
    const productId = result.insertId;
    
    // 自动创建7天空白数据
    const startDateObj = new Date(start_date);
    for (let i = 1; i <= 7; i++) {
      const dayDate = new Date(startDateObj);
      dayDate.setDate(startDateObj.getDate() + i - 1);
      const dateStr = dayDate.toISOString().split('T')[0];
      
      await pool.query(
        `INSERT INTO daily_data (product_id, day_number, date, status) VALUES (?, ?, ?, '未提交')`,
        [productId, i, dateStr]
      );
    }
    
    res.json({ id: productId, message: '产品创建成功，已生成7天数据表' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新每日数据
app.put('/api/daily-data/:productId/:dayNumber', async (req, res) => {
  try {
    const { productId, dayNumber } = req.params;
    const data = req.body;
    
    // 计算ROI
    const roi = data.ad_spend > 0 ? (data.ad_revenue / data.ad_spend).toFixed(2) : 0;
    
    // 判断阶段
    let phase = 'A';
    if (data.ad_impressions >= 5000) phase = 'B';
    if (roi >= 3 && data.ad_impressions >= 5000) phase = 'C';
    
    await pool.query(
      `UPDATE daily_data SET 
        visitors = ?, page_views = ?, clicks = ?, add_to_cart = ?,
        organic_orders = ?, manual_orders = ?,
        ad_impressions = ?, ad_clicks = ?, ad_orders = ?,
        ad_spend = ?, ad_revenue = ?, roi = ?, phase = ?,
        status = '待决策', updated_at = NOW()
       WHERE product_id = ? AND day_number = ?`,
      [
        data.visitors || 0, data.page_views || 0, data.clicks || 0, data.add_to_cart || 0,
        data.organic_orders || 0, data.manual_orders || 0,
        data.ad_impressions || 0, data.ad_clicks || 0, data.ad_orders || 0,
        data.ad_spend || 0, data.ad_revenue || 0, roi, phase,
        productId, dayNumber
      ]
    );
    
    res.json({ success: true, roi, phase });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 执行AI决策
app.put('/api/daily-data/:productId/:dayNumber/execute', async (req, res) => {
  try {
    const { productId, dayNumber } = req.params;
    const { ai_action, ai_reason, ai_confidence, executor_id } = req.body;
    
    await pool.query(
      `UPDATE daily_data SET 
        ai_action = ?, ai_reason = ?, ai_confidence = ?,
        status = '已执行', executor_id = ?, executed_at = NOW()
       WHERE product_id = ? AND day_number = ?`,
      [ai_action, ai_reason, ai_confidence, executor_id, productId, dayNumber]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 上报异常
app.put('/api/daily-data/:productId/:dayNumber/abnormal', async (req, res) => {
  try {
    const { productId, dayNumber } = req.params;
    const { abnormal_reason, executor_id } = req.body;
    
    await pool.query(
      `UPDATE daily_data SET 
        status = '异常', abnormal_reason = ?, executor_id = ?, executed_at = NOW()
       WHERE product_id = ? AND day_number = ?`,
      [abnormal_reason, executor_id, productId, dayNumber]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 上传Excel解析
app.post('/api/upload-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传文件' });
    }
    
    const filePath = req.file.path;
    const python = spawn('python3', ['/www/gmv-max/parse_shopee.py', filePath]);
    
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => { output += data.toString(); });
    python.stderr.on('data', (data) => { errorOutput += data.toString(); });
    
    python.on('close', (code) => {
      fs.unlink(filePath, () => {});
      
      if (code !== 0) {
        return res.status(500).json({ success: false, error: `Python错误: ${errorOutput}` });
      }
      
      try {
        const result = JSON.parse(output);
        res.json(result);
      } catch (e) {
        res.status(500).json({ success: false, error: `JSON错误: ${e.message}` });
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 根据SKU从解析数据中提取并保存
app.post('/api/import-data/:productId/:dayNumber', async (req, res) => {
  try {
    const { productId, dayNumber } = req.params;
    const { sku, parsedData } = req.body;
    
    // 从解析数据中找到匹配的SKU
    const matched = parsedData.find(p => p.product_id === sku);
    
    if (!matched) {
      return res.status(404).json({ success: false, error: `未找到产品ID: ${sku}` });
    }
    
    // 计算ROI
    const adSpend = matched.ad_spend || 0;
    const adRevenue = matched.ad_revenue || 0;
    const roi = adSpend > 0 ? (adRevenue / adSpend).toFixed(2) : 0;
    
    // 判断阶段
    const adImpressions = matched.ad_impressions || 0;
    let phase = 'A';
    if (adImpressions >= 5000) phase = 'B';
    if (roi >= 3 && adImpressions >= 5000) phase = 'C';
    
    // 更新数据
    await pool.query(
      `UPDATE daily_data SET 
        visitors = ?, page_views = ?, clicks = ?, add_to_cart = ?,
        organic_orders = ?, 
        ad_impressions = ?, ad_clicks = ?, ad_orders = ?,
        ad_spend = ?, ad_revenue = ?, roi = ?, phase = ?,
        status = '待决策', updated_at = NOW()
       WHERE product_id = ? AND day_number = ?`,
      [
        matched.visitors || 0, matched.page_views || 0, matched.clicks || 0, matched.add_to_cart || 0,
        matched.orders || 0,
        adImpressions, matched.ad_clicks || 0, matched.ad_conversions || 0,
        adSpend, adRevenue, roi, phase,
        productId, dayNumber
      ]
    );
    
    res.json({ 
      success: true, 
      message: '数据导入成功',
      data: { ...matched, roi, phase }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取产品统计
app.get('/api/stats', async (req, res) => {
  try {
    const { owner_id } = req.query;
    let whereClause = owner_id ? 'WHERE owner_id = ?' : '';
    let params = owner_id ? [owner_id] : [];
    
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(status = '进行中') as active,
        SUM(status = '已完成') as completed,
        SUM(status = '已暂停') as paused
      FROM products ${whereClause}
    `, params);
    
    res.json(stats[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('API running on http://localhost:3001');
});
