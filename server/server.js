const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const trainingRoutes = require('./routes/training');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态前端资源
app.use(express.static(path.join(__dirname, '..', 'public')));

// API 路由
app.use('/api', authRoutes);
app.use('/api', trainingRoutes);
app.use('/api', chatRoutes);

// 默认跳转到登录页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.listen(PORT, () => {
  console.log(`AIRP platform demo server running on http://localhost:${PORT}`);
});

