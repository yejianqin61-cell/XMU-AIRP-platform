// 主界面导航与数据加载

document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('airp_username');
  const avatar = document.getElementById('sidebar-avatar');
  const usernameEl = document.getElementById('sidebar-username');
  if (username && usernameEl && avatar) {
    usernameEl.textContent = username;
    avatar.textContent = username[0].toUpperCase();
  }

  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  const mainTitle = document.getElementById('main-title');
  const mainSubtitle = document.getElementById('main-subtitle');

  const titleMap = {
    intro: ['AIRP 多场景 AI 实训平台', '了解平台背景与核心能力。'],
    scenes: ['训练场景', '选择一个场景，进入 AI 角色扮演训练。'],
    report: ['能力评估报告', '查看不同角色场景下的示例报告与最近一次训练结果。'],
    team: ['团队介绍', '认识背后的项目团队与指导老师。']
  };

  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      navItems.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      pages.forEach((p) => p.classList.remove('active'));
      document.getElementById(`page-${page}`).classList.add('active');

      if (titleMap[page]) {
        mainTitle.textContent = titleMap[page][0];
        mainSubtitle.textContent = titleMap[page][1];
      }

      if (page === 'scenes') {
        loadScenes();
      } else if (page === 'report') {
        loadReports();
      }
    });
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('airp_token');
    localStorage.removeItem('airp_username');
    window.location.href = 'login.html';
  });

  document.getElementById('chat-send-btn')?.addEventListener('click', () => {
    window.airpChat.sendChatMessage();
  });

  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        window.airpChat.sendChatMessage();
      }
    });
  }

  // 默认加载产品简介
});

async function loadScenes() {
  const container = document.getElementById('scene-list');
  if (!container) return;
  container.innerHTML = '';

  // Demo 版本：使用前端内置的四个典型训练场景
  const scenes = [
    {
      id: 'AI教学训练',
      name: '高校学生',
      desc: '面向高校学生的课堂汇报、课程答辩等场景训练。'
    },
    {
      id: 'AI面试训练',
      name: '求职者',
      desc: '模拟结构化面试与开放式问答，提升求职表达与应答。'
    },
    {
      id: '特殊教育训练',
      name: '特殊教育工作者',
      desc: '支持与家长沟通、个别化教育计划说明等特殊教育场景。'
    },
    {
      id: '公共服务训练',
      name: '公务员',
      desc: '模拟窗口服务与政策解读，提升公共服务沟通能力。'
    }
  ];

  scenes.forEach((scene) => {
    const card = document.createElement('div');
    card.className = 'scene-card';
    card.dataset.sceneId = scene.id;
    card.innerHTML = `
      <div class="scene-card-title">${scene.name}</div>
      <div class="scene-card-desc">${scene.desc}</div>
    `;
    card.addEventListener('click', () => {
      enterScene(scene.id);
    });
    container.appendChild(card);
  });
}

function enterScene(sceneId) {
  const chatSection = document.getElementById('chat-section');
  const label = document.getElementById('chat-scenario-label');
  const container = document.getElementById('chat-messages');
  if (!chatSection || !label || !container) return;

  // 高亮当前选中的训练场景卡片
  const cards = document.querySelectorAll('.scene-card');
  cards.forEach((card) => {
    if (card.dataset.sceneId === sceneId) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  chatSection.classList.remove('hidden');
  container.innerHTML = '';

  window.airpChat.chatState.currentScenario = sceneId;
  window.airpChat.chatState.sessionId = null;

  label.textContent = `当前场景：${sceneId}`;

  // 自动发送第一句由 AI 开场
  apiPost('/api/chat', {
    sessionId: null,
    message: '开始训练',
    scenario: sceneId
  })
    .then((res) => {
      window.airpChat.chatState.sessionId = res.sessionId;
      window.airpChat.appendMessage('ai', res.ai_reply, container);
      if (res.report) {
        window.airpChat.chatState.lastReport = res.report;
        window.airpChat.renderReport(res.report);

        // 如果当前在能力报告页，刷新报告列表
        const reportPage = document.getElementById('page-report');
        if (reportPage && reportPage.classList.contains('active')) {
          loadReports();
        }
      }
    })
    .catch((err) => {
      console.error(err);
      window.airpChat.appendMessage('ai', '暂时无法开始训练，请稍后再试。', container);
    });
}

async function loadReports() {
  const list = document.getElementById('report-list');
  const dialogCard = document.getElementById('report-dialog-card');
  const dialogMessages = document.getElementById('report-dialog-messages');
  if (!list) return;

  list.innerHTML = '';
  if (dialogCard) dialogCard.classList.add('hidden');
  if (dialogMessages) dialogMessages.innerHTML = '';

  try {
    const records = await apiGet('/api/history');
    if (!records.length) {
      list.innerHTML =
        '<p class="muted">暂时还没有训练记录，请先在「训练场景」中完成一轮训练。</p>';
      return;
    }

    records.forEach((r) => {
      const item = document.createElement('div');
      item.className = 'report-card-item';
      const created = new Date(r.created_at).toLocaleString();
      const scoreText = r.score != null ? `${r.score.toFixed(1)} / 10` : '尚未评分';

      item.innerHTML = `
        <div class="report-card-header">${r.scenario}</div>
        <div class="report-card-meta">${created}</div>
        <div class="report-card-score">综合评分：${scoreText}</div>
      `;

      item.addEventListener('click', () => {
        loadReportDetail(r.id, r);
      });

      list.appendChild(item);
    });
  } catch (err) {
    console.error(err);
    list.innerHTML = '<p class="muted">无法加载历史报告，请检查后端服务。</p>';
  }
}

async function loadReportDetail(sessionId, meta) {
  const dialogCard = document.getElementById('report-dialog-card');
  const dialogMessages = document.getElementById('report-dialog-messages');
  const titleEl = document.getElementById('report-dialog-title');
  if (!dialogCard || !dialogMessages || !titleEl) return;

  dialogCard.classList.remove('hidden');
  dialogMessages.innerHTML = '';

  if (meta) {
    const created = new Date(meta.created_at).toLocaleString();
    const scoreText = meta.score != null ? `${meta.score.toFixed(1)} / 10` : '尚未评分';
    titleEl.textContent = `${meta.scenario} · ${scoreText} · ${created}`;
  } else {
    titleEl.textContent = '对话详情';
  }

  try {
    const msgs = await apiGet(`/api/history/${sessionId}`);
    msgs.forEach((m) => {
      window.airpChat.appendMessage(m.sender === 'ai' ? 'ai' : 'user', m.message, dialogMessages);
    });
  } catch (err) {
    console.error(err);
    dialogMessages.textContent = '加载对话详情失败。';
  }
}

