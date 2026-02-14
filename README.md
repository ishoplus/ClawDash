# ClawDash

[English](#english) | [繁體中文](#繁體中文)

---

## English

A real-time dashboard web application for monitoring OpenClaw Agent status.

### Features

- 🤖 **Smart Setup**: Auto-detects environment on first visit, one-click install if needed
- 📊 **Agent Status Monitoring**: Real-time display of Agent name, model, Token usage
- 📁 **Workspace Browsing**: Browse and download files from workspace
- 🔄 **Active Session Tracking**: View all active sessions
- ⏰ **Cron Job Management**: Enable/disable scheduled tasks
- 💬 **Session Control**: Terminate sessions, send messages
- 📈 **Analytics Insights**: Token trends, workload stats, error events
- 📋 **Log Viewer**: Real-time Gateway logs
- 🦞 **Gateway Control**: Restart/start/stop Gateway
- 🔧 **Configuration Center**: Unified API Key, Channels, and Skills management
- 🚨 **Smart Alerts**: Auto-detect issues and guide setup progress
- ⚙️ **Settings**: Configure refresh intervals, dark mode, environment status
- 🎨 **Responsive Design**: Dark mode support, adapts to all screen sizes
- 🌐 **i18n Support**: English + Traditional Chinese

### Screenshots

![Dashboard Overview](docs/screenshots/dashboard.png)

*Dashboard overview with real-time agent status*

![Analytics View](docs/screenshots/analytics.png)

*Token trends and workload analytics*

![Chat Interface](docs/screenshots/chat.png)

*Unified chat interface with session history*

![Files Browser](docs/screenshots/files.png)

*Workspace file browser with preview support*

---

### Prerequisites

| Requirement | Version | Description |
|-------------|---------|-------------|
| **Node.js** | 18+ | Run Next.js |
| **OpenClaw** | Latest | Must be installed |
| **OS** | macOS/Linux | Local file access required |
| **Browser** | Chrome/Safari/Edge | Modern browser |

> ⚠️ **Important**: Dashboard must run on the same machine where OpenClaw is installed, as it directly reads OpenClaw's local folders and CLI.

### Quick Start (Development)

```bash
# 1. Clone the repository
git clone <repo-url> clawdash
cd clawdash

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Then open **http://localhost:3000** in your browser.

### Production Deployment

```bash
# 1. Clone and install
git clone <repo-url> openclaw-dashboard
cd openclaw-dashboard
npm install

# 2. Build for production
npm run build

# 3. Start production server
npm start
```

### Vercel Deployment (Recommended)

```bash
# Method A: Vercel CLI
npm install -g vercel
vercel

# Method B: GitHub Auto-deploy
# 1. Push code to GitHub
# 2. Import project on Vercel
# 3. Automatic deployment
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t openclaw-dashboard .
docker run -p 3000:3000 openclaw-dashboard
```

### First Visit Flow

```
1. Open browser → http://localhost:3000
           │
           ▼
2. System auto-detects environment
           │
           ├── ✅ Ready → Enter Dashboard
           │
           └── ❌ Not installed → Show setup page
                          │
                          ▼
                   3. Click "Install"
                          │
                          ▼
                   4. Redirect to Dashboard
```

### Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| 📊 Dashboard | `/` | Main overview with alerts, agent status, sessions |
| 🔧 Config | `/config` | API Key, Channels, Skills configuration |
| 📈 Analytics | `/analytics` | Token trends, workload stats, errors |
| 📁 Files | `/files` | Browse and download workspace files |
| ⏰ Cron | `/cron` | Manage scheduled tasks |
| 💬 Chat | `/chat` | Unified chat and session history |
| 📋 Logs | `/logs` | Real-time Gateway logs |
| ⚙️ Settings | `/settings` | Refresh interval, dark mode, env status |

### API Endpoints

#### Data API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard` | GET | Main dashboard data |
| `/api/dashboard/agents` | GET | Agent list |
| `/api/dashboard/file` | GET/POST | File read/download |
| `/api/dashboard/files` | GET | Directory listing |
| `/api/dashboard/sessions` | DELETE | Terminate session |
| `/api/dashboard/sessions/message` | POST | Send message |
| `/api/dashboard/cron` | PATCH | Enable/disable cron |
| `/api/dashboard/gateway` | GET/POST | Gateway control |
| `/api/dashboard/history` | GET | Session history |
| `/api/dashboard/logs` | GET | Log reading |

#### Configuration API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/config` | GET | Overall configuration status |
| `/api/dashboard/config/apikey` | GET/POST/DELETE | API Key management |
| `/api/dashboard/config/channels` | GET/POST/DELETE/PATCH | Messaging channels setup |
| `/api/dashboard/config/skills` | GET/POST/DELETE | Skills enable/disable |
| `/api/dashboard/alerts` | GET | Smart alerts and setup progress |

#### Analytics API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/analytics/tokens` | GET | Token trends data |
| `/api/dashboard/analytics/workload` | GET | Workload statistics |
| `/api/dashboard/analytics/errors` | GET | Error event logs |

#### System API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Environment health check |

### Tech Stack

| Category | Technology |
|----------|-------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Runtime | Node.js 18+ |
| Deployment | Vercel / Netlify / Docker |

### Project Structure

```
clawdash/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   │   ├── dashboard/     # Dashboard APIs
│   │   │   │   ├── route.ts
│   │   │   │   ├── agents/
│   │   │   │   ├── analytics/
│   │   │   │   ├── cron/
│   │   │   │   ├── file/
│   │   │   │   ├── files/
│   │   │   │   ├── gateway/
│   │   │   │   ├── history/
│   │   │   │   ├── logs/
│   │   │   │   └── sessions/
│   │   │   └── health/       # Health check
│   │   ├── analytics/         # Analytics page
│   │   ├── chat/             # Chat page
│   │   ├── cron/             # Cron page
│   │   ├── files/            # Files page
│   │   ├── logs/             # Logs page
│   │   ├── sessions/          # Sessions page
│   │   ├── settings/         # Settings page
│   │   ├── setup/            # Setup wizard
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/
│   │   ├── dashboard/        # Dashboard components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AgentStatus.tsx
│   │   │   ├── ActiveSessions.tsx
│   │   │   ├── CronJobs.tsx
│   │   │   ├── WorkspaceFileExplorer.tsx
│   │   │   ├── TokenTrends.tsx
│   │   │   ├── WorkloadStats.tsx
│   │   │   ├── ErrorEvents.tsx
│   │   │   ├── LogViewer.tsx
│   │   │   ├── GatewayControl.tsx
│   │   │   └── SessionHistory.tsx
│   │   └── layout/
│   │       └── Navigation.tsx
│   └── lib/                  # Shared utilities
│       ├── types.ts
│       ├── parseLsOutput.ts
│       ├── validatePath.ts
│       ├── toast.tsx
│       ├── settings-context.tsx
│       └── i18n.ts           # Internationalization
├── public/                    # Static assets
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

### FAQ

**Q: Why can't load data?**
A: Please ensure:
1. OpenClaw is installed (`openclaw --version`)
2. Gateway is running (`openclaw gateway status`)
3. Dashboard runs on the same machine as OpenClaw

**Q: How to change port?**
```bash
PORT=3001 npm run dev
```

**Q: Is mobile supported?**
A: Yes, responsive design with touch optimization.

**Q: Is data real-time?**
A: Yes, auto-refresh every 30 seconds by default (configurable).

### License

MIT License - See [LICENSE](LICENSE)

### Links

- [OpenClaw Website](https://openclaw.ai)
- [OpenClaw Docs](https://docs.openclaw.ai)
- [GitHub Repository](https://github.com/openclaw/openclaw)
- [Issue Report](https://github.com/openclaw/openclaw/issues)

---

## 繁體中文

用於監控 OpenClaw Agent 狀態的即時看板網頁應用。

### 功能特性

- 🤖 **智能引導**: 首次訪問自動檢測環境，未安裝則一鍵安裝
- 📊 **Agent 狀態監控**: 即時顯示 Agent 名稱、模型、Token 使用情況
- 📁 **工作目錄瀏覽**: 瀏覽和下載工作目錄中的檔案
- 🔄 **活躍會話追蹤**: 顯示所有活躍的會話
- ⏰ **排程任務管理**: 啟用/停用 cron 定時任務
- 💬 **會話控制**: 終止會話、發送訊息
- 📈 **分析洞察**: Token 趨勢，工作負載統計，異常事件
- 📋 **日誌查看**: 即時查看 Gateway 運行日誌
- 🦞 **Gateway 控制**: 重啟/啟動/停止 Gateway
- 🔧 **配置中心**: 統一管理 API Key、通道、技能
- 🚨 **智能提醒**: 自動偵測問題並引導設定進度
- ⚙️ **設定頁面**: 配置應用程式選項、查看環境狀態
- 🎨 **響應式設計**: 支援深色模式，適配各種螢幕尺寸
- 🌐 **i18n 支援**: 英文 + 繁體中文

### 截圖展示

![儀表盤總覽](docs/screenshots/dashboard.png)

*即時 Agent 狀態監控*

![分析數據](docs/screenshots/analytics.png)

*Token 趨勢與負載分析*

![對話介面](docs/screenshots/chat.png)

*統一對話介面，支援會話歷史*

![檔案瀏覽器](docs/screenshots/files.png)

*工作目錄檔案瀏覽與預覽*

---

### 前置需求

| 需求 | 版本 | 說明 |
|------|------|------|
| **Node.js** | 18+ | 運行 Next.js |
| **OpenClaw** | 最新 | 必須已安裝 |
| **作業系統** | macOS/Linux | 讀取本地檔案需要 |
| **瀏覽器** | Chrome/Safari/Edge | 現代瀏覽器 |

> ⚠️ **重要**：Dashboard 必須運行在安裝 OpenClaw 的同一台機器上。

### 快速開始 (開發模式)

```bash
# 1. 複製專案
git clone <repo-url> openclaw-dashboard
cd openclaw-dashboard

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
npm run dev
```

打開瀏覽器訪問 **http://localhost:3000**

### 生產部署

```bash
# 1. 複製並安裝
git clone <repo-url> clawdash
cd clawdash
npm install

# 2. 建置
npm run build

# 3. 啟動
npm start
```

### Vercel 部署

```bash
npm install -g vercel
vercel
```

### Docker 部署

```bash
docker build -t openclaw-dashboard .
docker run -p 3000:3000 openclaw-dashboard
```

### 首次訪問流程

```
1. 打開瀏覽器 → http://localhost:3000
           │
           ▼
2. 系統自動檢測環境
           │
           ├── ✅ 就緒 → 進入 Dashboard
           │
           └── ❌ 未安裝 → 顯示引導頁面
                          │
                          ▼
                   3. 點擊「安裝」
                          │
                          ▼
                   4. 跳轉 Dashboard
```

### 頁面導覽

| 頁面 | 路由 | 功能說明 |
|------|------|----------|
| 📊 首頁 | `/` | 儀表盤總覽，含智能提醒與進度追蹤 |
| 🔧 配置 | `/config` | API Key、通道、技能統一配置 |
| 📈 分析 | `/analytics` | Token 趨勢、統計、異常 |
| 📁 檔案 | `/files` | 瀏覽下載檔案 |
| ⏰ Cron | `/cron` | 管理排程任務 |
| 💬 對話 | `/chat` | 統一對話頁面 |
| 📋 日誌 | `/logs` | Gateway 日誌 |
| ⚙️ 設定 | `/settings` | 設定與環境狀態 |

### 配置 API

| 端點 | 方法 | 功能說明 |
|------|------|----------|
| `/api/dashboard/config` | GET | 取得整體配置狀態 |
| `/api/dashboard/config/apikey` | GET/POST/DELETE | API Key 管理 |
| `/api/dashboard/config/channels` | GET/POST/DELETE/PATCH | 通道配置 |
| `/api/dashboard/config/skills` | GET/POST/DELETE | 技能啟用/停用 |
| `/api/dashboard/alerts` | GET | 智能提醒與設定進度 |

### 常見問題

**Q: 無法載入數據？**
A: 請確認：
1. OpenClaw 已安裝 (`openclaw --version`)
2. Gateway 正在運行 (`openclaw gateway status`)
3. Dashboard 與 OpenClaw 同機運行

**Q: 如何修改 Port？**
```bash
PORT=3001 npm run dev
```

**Q: 支援手機嗎？**
A: 是的，響應式設計支援手機平板。

**Q: 數據是即時的嗎？**
A: 是的，預設每 30 秒自動刷新。

### 許可證

MIT License - 詳見 [LICENSE](LICENSE)

### 相關連結

- [OpenClaw 官網](https://openclaw.ai)
- [OpenClaw 文檔](https://docs.openclaw.ai)
- [GitHub 倉庫](https://github.com/openclaw/openclaw)
