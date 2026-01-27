const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ 
  dest: '/tmp/uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gmvmax',
  socketPath: '/var/run/mysqld/mysqld.sock'
});

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { sku, name, price, owner_id } = req.body;
    const [result] = await pool.query(
      'INSERT INTO products (sku, name, price, owner_id) VALUES (?, ?, ?, ?)',
      [sku, name, price, owner_id]
    );
    res.json({ id: result.insertId, message: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/daily-data/:productId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM daily_data WHERE product_id = ? ORDER BY day_number',
      [req.params.productId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/daily-data', async (req, res) => {
  try {
    const { product_id, day_number, date, organic_orders, ad_impressions, ad_clicks, ad_orders, manual_orders, ad_spend, ad_revenue } = req.body;
    const roi = ad_spend > 0 ? (ad_revenue / ad_spend).toFixed(2) : 0;
    let phase = 'A';
    if (ad_impressions >= 5000) phase = 'B';
    if (roi >= 3 && ad_impressions >= 5000) phase = 'C';
    
    const [result] = await pool.query(
      'INSERT INTO daily_data (product_id, day_number, date, organic_orders, ad_impressions, ad_clicks, ad_orders, manual_orders, ad_spend, ad_revenue, roi, phase) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [product_id, day_number, date, organic_orders, ad_impressions, ad_clicks, ad_orders, manual_orders, ad_spend, ad_revenue, roi, phase]
    );
    res.json({ id: result.insertId, roi, phase, message: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

app.post('/api/save-parsed-data', async (req, res) => {
  try {
    const { products, day_number, date } = req.body;
    let saved = 0;
    for (const p of products) {
      try {
        const roi = p.ad_spend > 0 ? (p.ad_revenue / p.ad_spend).toFixed(2) : 0;
        let phase = 'A';
        if (p.ad_impressions >= 5000) phase = 'B';
        if (roi >= 3 && p.ad_impressions >= 5000) phase = 'C';
        await pool.query(
          `INSERT INTO daily_data (product_id, day_number, date, organic_orders, ad_impressions, ad_clicks, ad_orders, manual_orders, ad_spend, ad_revenue, roi, phase) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE organic_orders=VALUES(organic_orders), ad_impressions=VALUES(ad_impressions), ad_clicks=VALUES(ad_clicks), ad_orders=VALUES(ad_orders), ad_spend=VALUES(ad_spend), ad_revenue=VALUES(ad_revenue), roi=VALUES(roi), phase=VALUES(phase)`,
          [p.product_id, day_number, date, p.orders || 0, p.ad_impressions || 0, p.ad_clicks || 0, p.ad_conversions || 0, 0, p.ad_spend || 0, p.ad_revenue || 0, roi, phase]
        );
        saved++;
      } catch (e) {}
    }
    res.json({ success: true, saved, total: products.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3001, () => {
  console.log('API running on http://localhost:3001');
});
