const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const DEEPSEEK_TIMEOUT_MS = Number(process.env.DEEPSEEK_TIMEOUT_MS || 15000);

/**
 * 调用 DeepSeek 生成回复
 * @param {Object} opts
 * @param {string} opts.userInput 当前用户输入
 * @param {string} opts.scenario 场景名，如 "AI面试训练"
 * @param {Array<{sender: 'user'|'ai', message: string}>} opts.history 当前 session 的历史对话
 */
async function generateDeepSeekReply({ userInput, scenario, history = [] }) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const messages = [];

  // 场景系统提示词
  const scenarioPrompt = getScenarioSystemPrompt(scenario);
  messages.push({ role: 'system', content: scenarioPrompt });

  // 历史消息
  for (const m of history) {
    messages.push({
      role: m.sender === 'ai' ? 'assistant' : 'user',
      content: m.message
    });
  }

  // 当前用户输入
  messages.push({ role: 'user', content: userInput });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT_MS);

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 512
    })
  }).catch((err) => {
    clearTimeout(timeout);
    throw err;
  });

  clearTimeout(timeout);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const choice = data.choices && data.choices[0];
  const content = choice && choice.message && choice.message.content && choice.message.content.trim();
  if (!content) {
    throw new Error('Empty response from DeepSeek');
  }
  return content;
}

function getScenarioSystemPrompt(scenario) {
  switch (scenario) {
    case 'AI面试训练':
      return '你是一名严谨但友好的企业面试官，用中文多轮提问并结合候选人回答给出反馈和追问。回答要简洁清晰。';
    case 'AI教学训练':
      return '你是一名耐心的大学老师，用中文与学生讨论课程项目、学习困难和改进建议，注意引导学生多思考。';
    case '公共服务训练':
      return '你是一名政务服务窗口工作人员，用中文为群众解释政策与办理流程，并在冲突场景中保持冷静和礼貌。';
    case '特殊教育训练':
      return '你是一名特殊教育工作者，用中文与家长沟通个别化教育计划，注意共情、安抚和给出具体可执行建议。';
    default:
      return '你是一名多场景训练助手，用中文进行角色扮演与反馈，帮助用户提升沟通与应对能力。';
  }
}

module.exports = {
  generateDeepSeekReply
};

