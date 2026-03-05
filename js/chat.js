// 简单聊天渲染与交互

const chatState = {
  currentScenario: null,
  sessionId: null,
  lastReport: null
};

function appendMessage(sender, text, container) {
  const row = document.createElement('div');
  row.className = `message-row ${sender}`;

  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${sender}`;
  bubble.textContent = text;

  row.appendChild(bubble);
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const container = document.getElementById('chat-messages');
  const text = input.value.trim();
  if (!text || !chatState.currentScenario) return;

  appendMessage('user', text, container);
  input.value = '';

  try {
    const res = await apiPost('/api/chat', {
      sessionId: chatState.sessionId,
      message: text,
      scenario: chatState.currentScenario
    });

    chatState.sessionId = res.sessionId;
    appendMessage('ai', res.ai_reply, container);

    if (res.report) {
      chatState.lastReport = res.report;
      renderReport(res.report);
    }
  } catch (err) {
    appendMessage('ai', '服务器暂时不可用，请稍后再试。', container);
    console.error(err);
  }
}

function renderReport(report) {
  const placeholder = document.getElementById('report-placeholder');
  const card = document.getElementById('report-card');
  if (!card) return;

  placeholder.classList.add('hidden');
  card.classList.remove('hidden');

  const { metrics, suggestions, finalScore } = report;

  card.innerHTML = `
    <h2>${report.title}</h2>
    <p class="muted">本报告为 Demo 评分，仅用于展示评估流程，实际决赛版本将接入大模型与更精细的评价指标。</p>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:8px;">
      <div>沟通能力：<strong>${metrics.communication}/10</strong></div>
      <div>逻辑能力：<strong>${metrics.logic}/10</strong></div>
      <div>专业能力：<strong>${metrics.professional}/10</strong></div>
      <div>应变能力：<strong>${metrics.flexibility}/10</strong></div>
    </div>
    <p style="margin-top:10px;">综合评分：<strong>${finalScore}/10</strong></p>
    <p style="margin-top:8px;">改进建议：</p>
    <ul>
      ${suggestions.map((s) => `<li>${s}</li>`).join('')}
    </ul>
  `;
}

window.airpChat = {
  chatState,
  appendMessage,
  sendChatMessage,
  renderReport
};

