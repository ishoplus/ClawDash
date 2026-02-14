import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.env.HOME || '/Users/showang', '.openclaw', 'openclaw.json');
const OPENCLAW_SKILLS_PATH = '/Users/showang/.nvm/versions/node/v24.13.0/lib/node_modules/openclaw/skills';

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error';
  category: 'api' | 'channel' | 'skill' | 'gateway' | 'system';
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
  dismissible: boolean;
}

function getOpenClawConfig(): any {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading config:', e);
  }
  return {};
}

export async function GET() {
  const alerts: Alert[] = [];
  const config = getOpenClawConfig();

  // 1. API Key 檢查
  const modelsConfig = config?.models;
  let hasApiKey = false;
  let apiProvider = '';
  
  if (modelsConfig?.providers) {
    const providers = modelsConfig.providers;
    if (providers['minimax-portal']?.apiKey) {
      hasApiKey = true;
      apiProvider = 'MiniMax (OAuth)';
    } else if (providers['anthropic']?.apiKey) {
      hasApiKey = true;
      apiProvider = 'Anthropic Claude';
    } else if (providers['openai']?.apiKey) {
      hasApiKey = true;
      apiProvider = 'OpenAI GPT';
    } else if (providers['google']?.apiKey) {
      hasApiKey = true;
      apiProvider = 'Google Gemini';
    }
  }

  if (!hasApiKey) {
    alerts.push({
      id: 'no-api-key',
      type: 'error',
      category: 'api',
      title: 'No API Key Configured',
      message: 'OpenClaw needs an API key to use AI models. Add one to start using AI features.',
      action: {
        label: 'Configure API Key →',
        href: '/config'
      },
      dismissible: false
    });
  } else {
    alerts.push({
      id: 'api-configured',
      type: 'info',
      category: 'api',
      title: `Using ${apiProvider}`,
      message: 'AI model is configured and ready to use.',
      dismissible: false
    });
  }

  // 2. Gateway 檢查
  try {
    execSync('pgrep -f "openclaw.*gateway" > /dev/null 2>&1', { encoding: 'utf-8', timeout: 2000 });
  } catch (e) {
    alerts.push({
      id: 'gateway-stopped',
      type: 'warning',
      category: 'gateway',
      title: 'Gateway Not Running',
      message: 'The OpenClaw Gateway service is not running. Start it to enable full functionality.',
      action: {
        label: 'Start Gateway →',
        href: '/config'
      },
      dismissible: true
    });
  }

  // 3. Channel 檢查
  const channels = config?.channels;
  const channelCount = {
    telegram: channels?.telegram?.accounts ? Object.keys(channels.telegram.accounts).length : 0,
    whatsapp: !!channels?.whatsapp?.token,
    discord: !!channels?.discord?.token
  };
  
  const totalChannels = Object.values(channelCount).filter(Boolean).length;
  
  if (totalChannels === 0) {
    alerts.push({
      id: 'no-channels',
      type: 'warning',
      category: 'channel',
      title: 'No Messaging Channels',
      message: 'Configure a messaging channel (Telegram, WhatsApp) to communicate with your AI.',
      action: {
        label: 'Add Channel →',
        href: '/config'
      },
      dismissible: true
    });
  } else if (totalChannels === 1) {
    alerts.push({
      id: 'single-channel',
      type: 'info',
      category: 'channel',
      title: `${totalChannels} Channel Configured`,
      message: 'Consider adding more channels for redundancy.',
      action: {
        label: 'Add Another Channel →',
        href: '/config'
      },
      dismissible: true
    });
  }

  // 4. Skills 檢查
  let enabledSkills: string[] = [];
  try {
    const enabledPath = path.join(process.env.HOME || '/Users/showang', '.openclaw', 'enabled_skills.json');
    if (fs.existsSync(enabledPath)) {
      const data = JSON.parse(fs.readFileSync(enabledPath, 'utf-8'));
      enabledSkills = Array.isArray(data) ? data : [];
    }
  } catch (e) {
    // Ignore
  }

  // 檢查是否有技能目錄
  let totalSkills = 0;
  try {
    if (fs.existsSync(OPENCLAW_SKILLS_PATH)) {
      totalSkills = fs.readdirSync(OPENCLAW_SKILLS_PATH).filter(f => {
        const skillPath = path.join(OPENCLAW_SKILLS_PATH, f);
        return fs.statSync(skillPath).isDirectory();
      }).length;
    }
  } catch (e) {
    // Ignore
  }

  if (totalSkills > 0 && enabledSkills.length === 0) {
    alerts.push({
      id: 'no-skills',
      type: 'warning',
      category: 'skill',
      title: 'No Skills Enabled',
      message: 'Enable some skills to extend OpenClaw capabilities.',
      action: {
        label: 'Enable Skills →',
        href: '/config'
      },
      dismissible: true
    });
  } else if (enabledSkills.length > 0 && enabledSkills.length < 3) {
    alerts.push({
      id: 'few-skills',
      type: 'info',
      category: 'skill',
      title: `${enabledSkills.length} Skill(s) Enabled`,
      message: 'Explore more skills to unlock additional features.',
      action: {
        label: 'Browse Skills →',
        href: '/config'
      },
      dismissible: true
    });
  }

  // 5. System 檢查 - Node.js 版本
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    if (majorVersion < 22) {
      alerts.push({
        id: 'old-node',
        type: 'warning',
        category: 'system',
        title: 'Node.js Version Warning',
        message: `You are using Node.js ${nodeVersion}. OpenClaw recommends Node.js 22+ for best compatibility.`,
        dismissible: true
      });
    }
  } catch (e) {
    // Ignore
  }

  // 計算配置完成度
  const completionScore = (() => {
    let score = 0;
    let maxScore = 0;

    // API Key (40%)
    maxScore += 40;
    if (hasApiKey) score += 40;

    // Gateway (20%)
    maxScore += 20;
    try {
      execSync('pgrep -f "openclaw.*gateway" > /dev/null 2>&1', { encoding: 'utf-8', timeout: 2000 });
      score += 20;
    } catch (e) {
      // Gateway not running
    }

    // Channels (20%)
    maxScore += 20;
    if (totalChannels >= 1) score += 20;

    // Skills (20%)
    maxScore += 20;
    if (enabledSkills.length >= 3) score += 20;

    return Math.round((score / maxScore) * 100);
  })();

  return NextResponse.json({
    alerts,
    summary: {
      total: alerts.length,
      errors: alerts.filter(a => a.type === 'error').length,
      warnings: alerts.filter(a => a.type === 'warning').length,
      info: alerts.filter(a => a.type === 'info').length,
      completionScore
    }
  });
}
