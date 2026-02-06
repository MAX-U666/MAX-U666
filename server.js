const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 数据库连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gmvmax',
  socketPath: '/var/run/mysqld/mysqld.sock'
});

// 加载路由（注意：Express 5 中 app.use('/api') 会拦截所有 /api/* 子路径）
// 所以更具体的路径必须先注册

// EasyBoss 数据采集 + 订单路由（先注册，路径更具体）
const easybossRoutes = require('./routes/easyboss')(pool);
app.use('/api/easyboss', easybossRoutes);

// 产品管理路由（单品/组合SKU成本管理）
const productsRoutes = require('./routes/products')(pool);
app.use('/api/products', productsRoutes);

// 通用API路由
const apiRoutes = require('./routes/api')(pool);
app.use('/api', apiRoutes);

// 静态文件：前端 build
app.use(express.static(path.join(__dirname, 'build')));

// 所有其他请求返回前端（Express 5 兼容写法）
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// 启动服务器
app.listen(3001, () => {
  console.log('GMV MAX API v3.3 running on http://localhost:3001');
  console.log('集成千问 qwen-turbo AI 决策引擎');
  console.log('EasyBoss 数据采集+订单模块已加载');
  console.log('产品管理模块已加载');
});
