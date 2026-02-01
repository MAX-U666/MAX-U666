const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 数据库连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gmvmax',
  socketPath: '/var/run/mysqld/mysqld.sock'
});

// 加载路由
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
  console.log('GMV MAX API v3.1 running on http://localhost:3001');
  console.log('集成千问 qwen-turbo AI 决策引擎');
});
