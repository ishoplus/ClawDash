# ClawDash

A real-time dashboard for monitoring OpenClaw Agent status.

## Quick Install

```bash
npm install -g clawdash
clawdash
```

Open http://localhost:3000 in your browser.

## Features

- 🤖 Agent Status Monitoring - Real-time display of Agent name, model, Token usage
- 📊 Analytics Insights - Token trends, workload stats, error events
- 📁 Workspace Browsing - Browse and download files with Markdown preview
- 💬 Session Control - Terminate sessions, send messages
- ⏰ Cron Job Management - Enable/disable scheduled tasks
- 📋 Log Viewer - Real-time Gateway logs
- 🦞 Gateway Control - Restart/start/stop Gateway
- 🎨 Responsive Design - Dark mode support, adapts to all screen sizes
- 🌐 i18n Support - English + Traditional Chinese

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard overview |
| `/agents` | Agent list and selection |
| `/agents/[agentId]/files` | Per-agent file browser |
| `/analytics` | Token trends and analytics |
| `/chat` | Unified chat interface |
| `/config` | API Key, Channels, Skills configuration |
| `/cron` | Cron job management |
| `/history` | Session history |
| `/logs` | Gateway logs |
| `/sessions` | Active sessions |
| `/settings` | App settings |

## Requirements

- Node.js 18+
- OpenClaw (must be installed)
- macOS or Linux

## Development

```bash
git clone https://github.com/ishoplus/ClawDash.git
cd ClawDash
npm install
npm run dev
```

## Links

- [Website](https://openclaw.ai)
- [Docs](https://docs.openclaw.ai)
- [GitHub](https://github.com/ishoplus/ClawDash)

---

MIT License
