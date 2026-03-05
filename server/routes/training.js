const express = require('express');
const pool = require('../db');

const router = express.Router();

// 简单的鉴权中间件（从 header 读取 username，Demo 用）
function requireUser(req, res, next) {
  const username = req.header('x-username');
  if (!username) {
    return res.status(401).json({ message: '未登录' });
  }
  req.username = username;
  next();
}

// 获取训练场景列表
router.get('/scenarios', (req, res) => {
  res.json([
    { id: 'AI面试训练', name: 'AI面试训练', desc: '模拟企业面试官，多轮问答训练。' },
    { id: 'AI教学训练', name: 'AI教学训练', desc: '教学场景授课与答疑。' },
    { id: '公共服务训练', name: '公共服务训练', desc: '窗口服务、政务服务沟通训练。' },
    { id: '特殊教育训练', name: '特殊教育训练', desc: '特殊教育情境沟通与干预训练。' }
  ]);
});

// 获取历史训练记录
router.get('/history', requireUser, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id FROM users WHERE username = ?', [req.username]);
    if (users.length === 0) {
      return res.json([]);
    }
    const userId = users[0].id;
    const [sessions] = await pool.query(
      'SELECT id, scenario, score, created_at FROM training_sessions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单次训练详情（含对话）
router.get('/history/:sessionId', requireUser, async (req, res) => {
  const { sessionId } = req.params;
  try {
    const [messages] = await pool.query(
      'SELECT sender, message, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

