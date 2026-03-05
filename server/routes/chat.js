const express = require('express');
const pool = require('../db');
const { generateAIReply: generateFakeAIReply } = require('../services/fakeAI');
const { generateDeepSeekReply } = require('../services/deepseek');

const router = express.Router();

// Demo 简单鉴权：从 header 读取 username
async function getOrCreateUser(username) {
  const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
  if (rows.length > 0) return rows[0];
  const [result] = await pool.query(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, '']
  );
  return { id: result.insertId };
}

// 获取或创建训练 session
async function getOrCreateSession(userId, scenario, sessionId) {
  if (sessionId) {
    const [rows] = await pool.query(
      'SELECT id FROM training_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );
    if (rows.length > 0) return rows[0].id;
  }
  const [result] = await pool.query(
    'INSERT INTO training_sessions (user_id, scenario) VALUES (?, ?)',
    [userId, scenario]
  );
  return result.insertId;
}

// 生成简单随机评分
function generateRandomScore() {
  const metrics = {
    communication: Math.floor(Math.random() * 3) + 6, // 6-8
    logic: Math.floor(Math.random() * 4) + 5, // 5-8
    professional: Math.floor(Math.random() * 5) + 4, // 4-8
    flexibility: Math.floor(Math.random() * 3) + 7 // 7-9
  };
  const avg = (
    metrics.communication +
    metrics.logic +
    metrics.professional +
    metrics.flexibility
  ) / 4;
  return { metrics, finalScore: Number(avg.toFixed(1)) };
}

// AI 聊天接口
router.post('/chat', async (req, res) => {
  const { sessionId, message, scenario } = req.body;
  const username = req.header('x-username');

  if (!username) {
    return res.status(401).json({ message: '未登录' });
  }
  if (!message || !scenario) {
    return res.status(400).json({ message: '缺少必要参数' });
  }

  try {
    const user = await getOrCreateUser(username);
    const sid = await getOrCreateSession(user.id, scenario, sessionId);

    // 保存用户消息
    await pool.query(
      'INSERT INTO chat_messages (session_id, sender, message) VALUES (?, ?, ?)',
      [sid, 'user', message]
    );

    // 统计该 session 已有 AI 消息数量
    const [aiCountRows] = await pool.query(
      'SELECT COUNT(*) AS c FROM chat_messages WHERE session_id = ? AND sender = "ai"',
      [sid]
    );
    const aiTurnCount = aiCountRows[0].c;

    // 取当前 session 的完整历史对话，用于 DeepSeek 上下文
    const [historyRows] = await pool.query(
      'SELECT sender, message FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [sid]
    );

    // 优先使用 DeepSeek，大模型失败或未配置时回退 Fake AI
    let aiReply;
    try {
      if (process.env.DEEPSEEK_API_KEY) {
        aiReply = await generateDeepSeekReply({
          userInput: message,
          scenario,
          history: historyRows
        });
      } else {
        aiReply = generateFakeAIReply(message, scenario, aiTurnCount);
      }
    } catch (e) {
      console.error('DeepSeek error, fallback to Fake AI:', e);
      aiReply = generateFakeAIReply(message, scenario, aiTurnCount);
    }

    await pool.query(
      'INSERT INTO chat_messages (session_id, sender, message) VALUES (?, ?, ?)',
      [sid, 'ai', aiReply]
    );

    // 如果是最后一句，则生成评分并写入
    let report = null;
    const scriptEnded =
      aiReply.includes('本次面试结束') ||
      aiReply.includes('本次教学交流结束') ||
      aiReply.includes('本次服务结束') ||
      aiReply.includes('本次模拟结束');

    if (scriptEnded) {
      const { metrics, finalScore } = generateRandomScore();
      await pool.query(
        'UPDATE training_sessions SET score = ? WHERE id = ?',
        [finalScore, sid]
      );
      report = {
        title: 'AIRP 能力评估报告（Demo）',
        metrics,
        suggestions: [
          '建议增强逻辑表达，回答时多分点陈述。',
          '可以多结合实际案例，让回答更具体。',
          '注意语速与语气，让沟通更自然。'
        ],
        finalScore
      };
    }

    res.json({
      sessionId: sid,
      ai_reply: aiReply,
      report
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

