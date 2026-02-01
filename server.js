const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
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

// ============ 关键修复：共享 tokens ============
const tokens = new Map();

// API 路由（传入共享 tokens）
const apiRoutes = require('./routes/api')(pool, tokens);
app.use('/api', apiRoutes);

// 执行中心路由（传入共享 tokens）
const executeRoutes = require('./routes/execute')(pool, tokens);
app.use('/api/execute', executeRoutes);

// 静态文件：截图证据
app.use('/evidence', express.static(path.join(__dirname, 'evidence')));

// 静态文件：前端
app.use(express.static(path.join(__dirname, 'build')));

// 所有其他请求返回前端
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('========================================');
  console.log(`GMV MAX 服务器启动成功`);
  console.log(`端口: ${PORT}`);
  console.log(`模块: 决策工作台 + 执行中心`);
  console.log('========================================');
});
