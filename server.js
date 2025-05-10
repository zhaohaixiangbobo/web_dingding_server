/**
 * 食堂菜单管理系统后端服务
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
// const mysql = require('mysql2/promise');
// const axios = require('axios'); // 添加axios用于HTTP请求

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// // 数据库连接池
// const pool = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: '666666', // 根据实际情况修改
//   database: 'shitang_menu',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// 路由
const dishesRouter = require('./routes/dishes');
const evaluationsRouter = require('./routes/evaluations');
const dingtalkRouter = require('./routes/dingtalk');
const statisticsRouter = require('./routes/statistics');

app.use('/dishes', dishesRouter);
app.use('/evaluations', evaluationsRouter);
app.use('/dingtalk', dingtalkRouter);
app.use('/statistics', statisticsRouter);

// 根路由
app.get('/', (req, res) => {
  res.send('食堂菜单管理系统API服务正在运行');
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});

// // 导出数据库连接池供路由使用
// module.exports = { pool };