// 预设对话脚本（用于兜底，无大模型或出错时使用）

const INTERVIEW_SCRIPT = [
  '你好，请做一个简单自我介绍。',
  '为什么选择我们公司？',
  '你认为自己的主要优点是什么？',
  '本次面试结束，感谢你的回答。'
];

const TEACHING_SCRIPT = [
  '同学你好，我们先从你最感兴趣的学科聊起，是什么？',
  '学习这门课时，你最大的困难是什么？',
  '如果给你一次机会重新学习，你会怎么规划？',
  '本次教学交流结束，欢迎随时来和我继续学习。'
];

const PUBLIC_SERVICE_SCRIPT = [
  '您好，这里是公共服务智能助手，请问有什么可以帮您？',
  '收到您的需求，能再详细描述一下场景吗？',
  '如果要立刻推进，您认为第一步该做什么？',
  '本次服务结束，感谢您的咨询。'
];

const SPECIAL_EDU_SCRIPT = [
  '你好，我是特殊教育场景下的 AI 伙伴，请先告诉我你的角色。',
  '在这个角色中，你最担心遇到什么情况？',
  '如果学生出现突发情绪，你打算怎么安抚？',
  '本次模拟结束，欢迎继续练习不同的情况。'
];

const SCRIPTS_BY_SCENARIO = {
  'AI面试训练': INTERVIEW_SCRIPT,
  'AI教学训练': TEACHING_SCRIPT,
  '公共服务训练': PUBLIC_SERVICE_SCRIPT,
  '特殊教育训练': SPECIAL_EDU_SCRIPT
};

/**
 * 根据当前 session 已有 AI 轮数，返回下一句脚本
 * @param {string} scenario
 * @param {number} aiTurnCount 已经发送出去的 AI 消息条数
 */
function generateAIReply(userInput, scenario, aiTurnCount) {
  const script = SCRIPTS_BY_SCENARIO[scenario] || INTERVIEW_SCRIPT;
  const index = Math.min(aiTurnCount, script.length - 1);
  return script[index];
}

module.exports = {
  generateAIReply
};
