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
      return `
你是一名严谨但友好的企业面试官，正在对高校学生进行求职面试，请严格遵守以下规则：
1. 使用简体中文与候选人对话。
2. 面试流程：自我介绍 -> 动机与岗位匹配度 -> 能力与案例 -> 综合收尾。
3. 每轮你的回复应包含：
   - 对上一轮回答的简短评价（1–2 句，可选）
   - 一个新的面试问题（1 句为宜）。
4. 总共最多提问 8 轮问题，当你认为信息已经足够时，在最后一条回复中自然地给出整体评价，并且必须包含“本次面试结束”这几个字。
5. 不要替学生作答，不要输出评分数字，只负责提问、引导和口头评价。
6. 语气专业、礼貌、鼓励式，避免攻击性或过度随意的表达。
`.trim();
    case 'AI教学训练':
      return `
你是一名耐心的大学教师，正在与学生进行课堂汇报 / 课程项目交流，请严格遵守以下规则：
1. 使用简体中文与学生对话。
2. 对话目标：帮助学生清晰表达项目目标、过程、难点与改进计划。
3. 每轮你的回复应包含：
   - 对学生上一轮表述的简短反馈（肯定 + 建议，各 1 句为宜）
   - 一个聚焦的问题，引导学生进一步澄清或反思。
4. 整个教学交流不超过 8 轮，当你认为学生已经形成较完整的思路时，在最后一条回复中给出整体建议，并且必须包含“本次教学交流结束”这几个字。
5. 不要直接给出完整答案，要通过提问和启发式反馈促进学生思考。
6. 语气友好、鼓励、专业，适当使用通俗比喻帮助理解。
`.trim();
    case '公共服务训练':
      return `
你是一名政务服务大厅的窗口工作人员，正在通过对话处理群众咨询，请严格遵守以下规则：
1. 使用简体中文，保持官方但亲和的语气。
2. 主要目标：澄清群众诉求、解释相关政策与办理流程、给出可执行的下一步建议。
3. 每轮你的回复应包含：
   - 对群众诉求的复述或确认（1 句）
   - 针对当前问题的解释 / 指引（1–3 句）
   - 如有需要，再提出一个澄清性问题。
4. 在遇到情绪激动的表述时，要先共情安抚，再说明政策边界。
5. 整个服务过程不超过 8 轮，当问题已经得到清晰回复时，在最后一条回复中总结要点，并且必须包含“本次服务结束”这几个字。
6. 不要捏造具体法律条文或编号，政策信息保持中性、概括性表述。
`.trim();
    case '特殊教育训练':
      return `
你是一名特殊教育工作者，正在与学生家长就个别化教育计划进行沟通，请严格遵守以下规则：
1. 使用简体中文，语气温和、共情、专业。
2. 对话目标：了解学生当前情况、家长担忧，解释个别化教育计划的重点，并给出家庭配合建议。
3. 每轮你的回复应包含：
   - 对家长情绪与诉求的共情回应（1–2 句）
   - 对当前问题的专业解释或建议（1–3 句）
   - 如有需要，再提出一个简单、具体的追问。
4. 注意避免标签化、否定性的表述，多使用中性或正向语言。
5. 整个模拟对话不超过 8 轮，当你认为本次沟通目标已经达成时，在最后一条回复中给出总结建议，并且必须包含“本次模拟结束”这几个字。
6. 不要提供医疗诊断，只从教育干预与家庭配合角度给出建议。
`.trim();
    default:
      return '你是一名多场景训练助手，用中文进行角色扮演与反馈，帮助用户提升沟通与应对能力。';
  }
}

/**
 * 使用 DeepSeek 对一次完整对话进行能力评估打分
 * 返回结构与原有随机评分逻辑保持兼容
 * @param {Object} opts
 * @param {string} opts.scenario
 * @param {Array<{sender: 'user'|'ai', message: string}>} opts.history
 */
async function generateDeepSeekReport({ scenario, history = [] }) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const transcript = buildTranscriptForScoring(history, scenario);

  const systemPrompt = `
你是一名面试与教学评估专家，请根据对话对学员的表现进行评价。
仅从「沟通能力、逻辑能力、专业能力、应变能力」四个维度评分，每项 0-10 分，并给出每项 1-2 句中文点评，再给一个整体评价。
请严格按照 JSON 返回，格式如下（注意所有字段名用英文）：
{
  "communication": { "score": 0-10, "comment": "..." },
  "logic": { "score": 0-10, "comment": "..." },
  "professional": { "score": 0-10, "comment": "..." },
  "flexibility": { "score": 0-10, "comment": "..." },
  "overall_comment": "整体评价"
}
不要输出任何 JSON 以外的文字。
`.trim();

  const userContent = `
场景：${scenario}
下面是按时间顺序整理的完整对话，格式为「说话人：内容」：

${transcript}

请根据上述对话，按照约定的 JSON 格式返回评分与点评。
`.trim();

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
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.4,
      max_tokens: 512,
      response_format: { type: 'json_object' }
    })
  }).catch((err) => {
    clearTimeout(timeout);
    throw err;
  });

  clearTimeout(timeout);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek API error (report): ${res.status} ${text}`);
  }

  const data = await res.json();
  const choice = data.choices && data.choices[0];
  const jsonStr =
    choice && choice.message && typeof choice.message.content === 'string'
      ? choice.message.content
      : null;

  if (!jsonStr) {
    throw new Error('Empty report content from DeepSeek');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error('Failed to parse DeepSeek report JSON: ' + e.message);
  }

  const metrics = {
    communication: clampScore(parsed.communication && parsed.communication.score),
    logic: clampScore(parsed.logic && parsed.logic.score),
    professional: clampScore(parsed.professional && parsed.professional.score),
    flexibility: clampScore(parsed.flexibility && parsed.flexibility.score)
  };

  // 如果某些维度缺失，就用 0 占位，后续可以再做平滑
  const scores = Object.values(metrics);
  const validScores = scores.filter((n) => typeof n === 'number' && !Number.isNaN(n));
  const avg =
    validScores.length > 0
      ? validScores.reduce((sum, n) => sum + n, 0) / validScores.length
      : 0;
  const finalScore = Number(avg.toFixed(1));

  const suggestions = [];
  if (parsed.communication && parsed.communication.comment) {
    suggestions.push(`沟通能力：${parsed.communication.comment}`);
  }
  if (parsed.logic && parsed.logic.comment) {
    suggestions.push(`逻辑能力：${parsed.logic.comment}`);
  }
  if (parsed.professional && parsed.professional.comment) {
    suggestions.push(`专业能力：${parsed.professional.comment}`);
  }
  if (parsed.flexibility && parsed.flexibility.comment) {
    suggestions.push(`应变能力：${parsed.flexibility.comment}`);
  }
  if (parsed.overall_comment) {
    suggestions.push(`综合评价：${parsed.overall_comment}`);
  }

  return {
    metrics,
    finalScore,
    suggestions
  };
}

function clampScore(raw) {
  const n = Number(raw);
  if (Number.isNaN(n)) return 0;
  // 将分数限定在 0-10 区间内
  const clamped = Math.max(0, Math.min(10, n));
  // 也可以根据需要进一步压缩到 4-9 区间
  return Number(clamped.toFixed(1));
}

function buildTranscriptForScoring(history, scenario) {
  let userLabel = '学员';
  let aiLabel = 'AI';

  switch (scenario) {
    case 'AI面试训练':
      userLabel = '候选人';
      aiLabel = '面试官';
      break;
    case 'AI教学训练':
      userLabel = '学生';
      aiLabel = '教师';
      break;
    case '公共服务训练':
      userLabel = '群众';
      aiLabel = '窗口工作人员';
      break;
    case '特殊教育训练':
      userLabel = '家长';
      aiLabel = '特殊教育工作者';
      break;
    default:
      break;
  }

  return history
    .map((m) => `${m.sender === 'ai' ? aiLabel : userLabel}：${m.message}`)
    .join('\n');
}

module.exports = {
  generateDeepSeekReply,
  generateDeepSeekReport
};

