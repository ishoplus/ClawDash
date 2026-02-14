import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.env.HOME || '/Users/showang', '.openclaw', 'openclaw.json');

interface OpenClawConfig {
  models?: {
    providers?: Record<string, { apiKey?: string; defaultModel?: string }>;
  };
  channels?: {
    telegram?: {
      accounts?: Record<string, { botToken?: string; enabled?: boolean }>;
      enabled?: boolean;
    };
    whatsapp?: { token?: string; enabled?: boolean };
    discord?: { token?: string; enabled?: boolean };
  };
  [key: string]: unknown;
}

function getOpenClawConfig(): OpenClawConfig | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading config:', e);
  }
  return null;
}

function saveOpenClawConfig(config: OpenClawConfig): boolean {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (e) {
    console.error('Error saving config:', e);
    return false;
  }
}

export async function GET() {
  try {
    const config = getOpenClawConfig();
    
    // 檢測各項配置狀態
    const configStatus: {
      apiKey: { configured: boolean; provider: string | null; model: string | null };
      channels: Record<string, { configured: boolean; enabled?: boolean }>;
      skills: { total: number; enabled: number; riskLevels: Record<string, number> };
      gateway: { running: boolean };
    } = {
      apiKey: {
        configured: false,
        provider: null,
        model: null
      },
      channels: {
        telegram: { configured: false },
        whatsapp: { configured: false },
        discord: { configured: false }
      },
      skills: {
        total: 0,
        enabled: 0,
        riskLevels: { high: 0, medium: 0, low: 0 }
      },
      gateway: {
        running: false
      }
    };

    // 檢測 API Key - OpenClaw 使用 models.providers[provider].apiKey 格式
    const modelsConfig = config?.models;
    if (modelsConfig?.providers) {
      const providers = modelsConfig.providers;
      
      // 檢查 minimax-portal (預設 - OAuth 或 API Key)
      const minimaxProvider = providers['minimax-portal'];
      if (minimaxProvider) {
        const hasApiKey = minimaxProvider.apiKey && minimaxProvider.apiKey !== 'minimax-oauth';
        const hasOAuth = minimaxProvider.apiKey === 'minimax-oauth' || minimaxProvider.apiKey === 'oauth';
        
        if (hasApiKey || hasOAuth) {
          configStatus.apiKey.configured = true;
          configStatus.apiKey.provider = 'minimax-portal';
          configStatus.apiKey.model = 'MiniMax-M2.1';
        }
      }
      // 檢查 Anthropic
      else if (providers['anthropic']?.apiKey) {
        configStatus.apiKey.configured = true;
        configStatus.apiKey.provider = 'anthropic';
        configStatus.apiKey.model = providers['anthropic'].defaultModel || 'claude-sonnet-4';
      }
      // 檢查 OpenAI
      else if (providers['openai']?.apiKey) {
        configStatus.apiKey.configured = true;
        configStatus.apiKey.provider = 'openai';
        configStatus.apiKey.model = providers['openai'].defaultModel || 'gpt-4o';
      }
      // 檢查 Google
      else if (providers['google']?.apiKey) {
        configStatus.apiKey.configured = true;
        configStatus.apiKey.provider = 'google';
        configStatus.apiKey.model = providers['google'].defaultModel || 'gemini-2.0-flash';
      }
    }

    // 檢測通道 - OpenClaw 使用 channels.telegram.accounts[account].botToken 格式
    if (config?.channels) {
      const channels = config.channels;
      
      // Telegram
      if (channels.telegram) {
        const accounts = channels.telegram.accounts;
        if (accounts && Object.keys(accounts).length > 0) {
          configStatus.channels.telegram.configured = true;
          configStatus.channels.telegram.enabled = channels.telegram.enabled !== false;
        }
      }
      // WhatsApp
      if (channels.whatsapp?.token) {
        configStatus.channels.whatsapp.configured = true;
        configStatus.channels.whatsapp.enabled = channels.whatsapp.enabled !== false;
      }
      // Discord
      if (channels.discord?.token) {
        configStatus.channels.discord.configured = true;
        configStatus.channels.discord.enabled = channels.discord.enabled !== false;
      }
    }

    // 技能統計
    try {
      const skillsPath = path.join(process.env.HOME || '/Users/showang', '.openclaw', 'skills');
      if (fs.existsSync(skillsPath)) {
        const dirs = fs.readdirSync(skillsPath).filter(f => 
          fs.statSync(path.join(skillsPath, f)).isDirectory()
        );
        configStatus.skills.total = dirs.length;
        
        const enabledSkillsPath = path.join(process.env.HOME || '/Users/showang', '.openclaw', 'enabled_skills.json');
        if (fs.existsSync(enabledSkillsPath)) {
          const enabled = JSON.parse(fs.readFileSync(enabledSkillsPath, 'utf-8'));
          configStatus.skills.enabled = Array.isArray(enabled) ? enabled.length : 0;
        }
      }
    } catch (e) {
      // Skills directory might not exist
    }

    // 檢測 Gateway 狀態
    try {
      // 使用絕對路徑避免 PATH 問題
      const stdout = execSync('/opt/homebrew/bin/openclaw gateway status', { encoding: 'utf-8', timeout: 5000 });
      const runningMatch = stdout.match(/runtime:\s+(\w+)/i);
      configStatus.gateway.running = !!(runningMatch && runningMatch[1] === 'running');
    } catch (e) {
      configStatus.gateway.running = false;
    }

    return NextResponse.json(configStatus);
  } catch (error) {
    console.error('Config API error:', error);
    return NextResponse.json({ error: 'Failed to get config status' }, { status: 500 });
  }
}
