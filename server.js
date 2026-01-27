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

// =============================================
// 用户相关 API
// =============================================

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 产品相关 API
// =============================================

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
    
    const today = new Date();
    const startDate = new Date(product.start_date);
    const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    product.current_day = Math.min(Math.max(diffDays, 1), 7);
    
    const [dailyData] = await pool.query(
      'SELECT * FROM daily_data WHERE product_id = ? ORDER BY day_number',
      [req.params.id]
    );
    
    dailyData.forEach(d => {
      d.natural_orders = Math.max(0, (d.orders_created || d.organic_orders || 0) - (d.ad_orders || 0));
    });
    
    product.daily_data = dailyData;
    
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { sku, name, price, owner_id, start_date, target_roi } = req.body;
    
    const [existing] = await pool.query(
      'SELECT id FROM products WHERE sku = ? AND start_date = ?',
      [sku, start_date]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: '该产品在此日期已存在' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO products (sku, name, price, owner_id, start_date, target_roi) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sku, name, price || 0, owner_id, start_date, target_roi || 3.0]
    );
    
    const productId = result.insertId;
    
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
    
    res.json({ id: productId, message: '产品创建成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 日数据相关 API - 26列完整版
// =============================================

app.put('/api/daily-data/:productId/:dayNumber/shop', async (req, res) => {
  try {
    const { productId, dayNumber } = req.params;
    const data = req.body;
    
    const conversionRate = data.visitors > 0 
      ? (data.orders_created / data.visitors * 100).toFixed(2) 
      : 0;
    
    await pool.query(
      `UPDATE daily_data SET 
        visitors = ?,
        page_views = ?,
        visitors_no_buy = ?,
        visitors_no_buy_rate = ?,
        clicks = ?,
        likes = ?,
        cart_visitors = ?,
        add_to_cart = ?,
        cart_rate = ?,
        orders_created = ?,
        items_created = ?,
        revenue_created = ?,
        conversion_rate = ?,
        orders_ready = ?,
        items_ready = ?,
        revenue_ready = ?,
        ready_rate = ?,
        ready_created_rate = ?,
        organic_orders = ?,
        status = IF(status = '未提交', '待决策', status),
        updated_at = NOW()
       WHERE product_id = ? AND day_number = ?`,
      [
        data.visitors || 0,
        data.page_views || 0,
        data.visitors_no_buy || 0,
        data.visitors_no_buy_rate || 0,
        data.clicks || 0,
        data.likes || 0,
        data.cart_visitors || 0,
        data.add_to_cart || 0,
        data.cart_rate || 0,
        data.orders_created || 0,
        data.items_created || 0,
        data.revenue_created || 0,
        conversionRate,
        data.orders_ready || 0,
        data.items_ready || 0,
        data.revenue_ready || 0,
        data.ready_rate || 0,
        data.ready_created_rate || 0,
        data.orders_created || 0,
        productId, 
        dayNumber
      ]
    );
    
    const [rows] = await pool.query(
      'SELECT * FROM daily_data WHERE product_id = ? AND day_number = ?',
      [productId, dayNumber]
    );
    
    if (rows.length > 0) {
      const row = rows[0];
      const roi = row.ad_spend > 0 ? (row.ad_revenue / row.ad_spend).toFixed(2) : 0;
      let phase = 'A';
      if (row.ad_impressions >= 5000) phase = 'B';
      if (roi >= 3 && row.ad_impressions >= 5000) phase = 'C';
      
      await pool.query(
        'UPDATE daily_data SET roi = ?, phase = ? WHERE product_id = ? AND day_number = ?',
        [roi, phase, productId, dayNumber]
      );
    }
    
    res.json({ success: true, message: '店铺数据更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/daily-data/:productId/:dayNumber/ad', async (req, res) => {
  try {
    const { productId, dayNumber } = req.params;
    const data = req.body;
    
    const adSpend = data.ad_spend || 0;
    const adRevenue = data.ad_revenue || 0;
    const roi = adSpend > 0 ? (adRevenue / adSpend).toFixed(2) : 0;
    
    let phase = 'A';
    const adImpressions = data.ad_impressions || 0;
    if (adImpressions >= 5000) phase = 'B';
    if (roi >= 3 && adImpressions >= 5000) phase = 'C';
    
    await pool.query(
      `UPDATE daily_data SET 
        ad_impressions = ?, 
        ad_clicks = ?, 
        ad_orders = ?,
        ad_spend = ?, 
        ad_revenue = ?, 
        roi = ?, 
        phase = ?,
        status = IF(status = '未提交', '待决策', status),
        updated_at = NOW()
       WHERE product_id = ? AND day_number = ?`,
      [
        adImpressions,
        data.ad_clicks || 0, 
        data.ad_conversions || 0,
        adSpend, 
        adRevenue, 
        roi, 
        phase,
        productId, 
        dayNumber
      ]
    );
    
    res.json({ success: true, roi, phase, message: '广告数据更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/daily-data/:productId/:dayNumber/manual', async (req, res) => {
  try {
    const { productId, dayNumber } = req.params;
    const { manual_orders } = req.body;
    
    await pool.query(
      `UPDATE daily_data SET manual_orders = ?, updated_at = NOW()
       WHERE product_id = ? AND day_number = ?`,
      [manual_orders || 0, productId, dayNumber]
    );
    
    res.json({ success: true, message: '补单数据更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/daily-data/:productId/:dayNumber', async (req, res) => {
  try {
    const { productId, dayNumber } = req.params;
    const data = req.body;
    
    const roi = data.ad_spend > 0 ? (data.ad_revenue / data.ad_spend).toFixed(2) : 0;
    
    let phase = 'A';
    if (data.ad_impressions >= 5000) phase = 'B';
    if (roi >= 3 && data.ad_impressions >= 5000) phase = 'C';
    
    await pool.query(
      `UPDATE daily_data SET 
        visitors = ?, page_views = ?, clicks = ?, add_to_cart = ?,
        organic_orders = ?, orders_created = ?, manual_orders = ?,
        ad_impressions = ?, ad_clicks = ?, ad_orders = ?,
        ad_spend = ?, ad_revenue = ?, roi = ?, phase = ?,
        status = '待决策', updated_at = NOW()
       WHERE product_id = ? AND day_number = ?`,
      [
        data.visitors || 0, data.page_views || 0, data.clicks || 0, data.add_to_cart || 0,
        data.organic_orders || 0, data.orders_created || data.organic_orders || 0, data.manual_orders || 0,
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

// =============================================
// AI决策相关 API
// =============================================

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

// =============================================
// 文件上传解析 API
// =============================================

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

// =============================================
// 启动服务器
// =============================================

app.listen(3001, () => {
  console.log('GMV MAX API v2.0 running on http://localhost:3001');
});
