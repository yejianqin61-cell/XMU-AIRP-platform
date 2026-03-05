# AIRP 多场景 AI 角色扮演实训平台 Demo

本项目是 AIRP（AI Role Play）多场景角色扮演实训平台的初赛 Demo 版本，前后端分离，后端使用 Node.js + Express + MySQL，前端为原生 HTML + CSS + JavaScript，AI 模块暂用 Fake AI 脚本，并预留大模型 API 接口。

## 目录结构

- `public/`：前端静态页面
  - `login.html`：登录页
  - `register.html`：注册页
  - `app.html`：主应用界面（产品简介、训练场景、能力报告、历史评测、团队介绍）
- `css/`
  - `style.css`：整体布局与 ChatGPT/Notion 风格样式
- `js/`
  - `api.js`：封装前端调用后端 RESTful API 的方法
  - `chat.js`：AI 对话界面逻辑、Fake AI 返回处理、能力报告渲染
  - `app.js`：左侧导航、训练场景加载、历史记录与对话详情
- `server/`
  - `server.js`：Express 启动入口，挂载各 API 路由并托管前端静态资源
  - `db.js`：MySQL 连接池配置
  - `routes/auth.js`：用户注册 `/api/register`、登录 `/api/login`
  - `routes/training.js`：训练场景 `/api/scenarios`、历史记录 `/api/history`
  - `routes/chat.js`：AI 聊天 `/api/chat`，负责 Fake AI 流程与评分生成
  - `services/fakeAI.js`：基于脚本的 Fake AI，实现 `generateAIReply(userInput, scenario)`
- `sql/schema.sql`：数据库建表脚本
- `.env.example`：环境变量示例

## 环境准备

1. 安装依赖：

```bash
cd airp-platform
npm install
```

2. 配置数据库：

- 确保本地安装并启动 MySQL。
- 创建数据库和数据表：

```bash
mysql -u root -p < sql/schema.sql
```

- 复制 `.env.example` 为 `.env`，根据本机情况修改数据库账号、密码等配置：

```bash
cp .env.example .env
```

3. 启动后端服务：

```bash
npm start
# 或开发模式：
npm run dev
```

服务默认运行在 `http://localhost:4000`。

## 使用说明

1. 访问 `http://localhost:4000/`，进入登录页。
2. 若无账号，可点击“去注册”，完成注册后返回登录。
3. 登录成功后进入 `/public/app.html` 主界面：
   - 左侧为「产品简介 / 训练场景 / 能力报告 / 历史评测 / 团队介绍」导航。
   - 右侧主内容区展示对应模块，训练场景下可选择 AI 面试 / 教学 / 公共服务 / 特殊教育等卡片，进入类似 ChatGPT 的对话界面。
4. 在训练结束后，系统会随机生成 Demo 版能力评估报告，并可在「能力报告」与「历史评测」模块中查看与复盘对话记录。

## Fake AI 与大模型接口预留

- 当前版本的 AI 回复由 `server/services/fakeAI.js` 中的脚本驱动：
  - 不同场景（AI 面试、教学、公共服务、特殊教育）对应不同对话脚本。
  - 每次用户回复后，Fake AI 返回脚本中的下一句话，直至结束。
- 在后续决赛版本中，可在 `generateAIReply(userInput, scenario)` 内部替换为真实大模型调用（如 OpenAI、DeepSeek 等），保留相同的入参和返回方式即可。

