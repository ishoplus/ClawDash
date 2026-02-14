import { NextResponse } from 'next/server';
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
  gateway?: {
    port?: number;
    autoStart?: boolean;
  };
  [key: string]: any;
}

// 讀取統一配置
function getGlobalConfig(): OpenClawConfig | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading global config:', e);
  }
  return null;
}

// 儲存統一配置
function saveGlobalConfig(config: OpenClawConfig): boolean {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (e) {
    console.error('Error saving global config:', e);
    return false;
  }
}

// GET: 取得統一配置狀態
export async function GET() {
  try {
    const config = getGlobalConfig();
    
    const status = {
      // API Key 狀態
      apiKey: {
        configured: false,
        provider: null as string | null,
        model: null as string | null,
      },
      // 頻道狀態
      channels: {
        telegram: { configured: false, enabled: false },
        whatsapp: { configured: false, enabled: false },
        discord: { configured: false, enabled: false },
      },
      // Gateway 設定
      gateway: {
        port: 19000,
        autoStart: true,
      },
    };

    // 檢測 API Key
    const modelsConfig = config?.models;
    if (modelsConfig?.providers) {
      for (const [provider, providerData] of Object.entries(modelsConfig.providers)) {
        if (providerData?.apiKey && providerData.apiKey !== 'minimax-oauth' && providerData.apiKey !== 'oauth') {
          status.apiKey.configured = true;
          status.apiKey.provider = provider;
          status.apiKey.model = providerData.defaultModel || null;
          break;
        }
      }
    }

    // 檢測頻道
    if (config?.channels) {
      const telegram = config.channels.telegram;
      if (telegram?.accounts && Object.keys(telegram.accounts).length > 0) {
        status.channels.telegram.configured = true;
        status.channels.telegram.enabled = telegram.enabled !== false;
      }
      if (config.channels.whatsapp?.token) {
        status.channels.whatsapp.configured = true;
        status.channels.whatsapp.enabled = config.channels.whatsapp.enabled !== false;
      }
      if (config.channels.discord?.token) {
        status.channels.discord.configured = true;
        status.channels.discord.enabled = config.channels.discord.enabled !== false;
      }
    }

    // Gateway 設定
    if (config?.gateway) {
      status.gateway.port = config.gateway.port || 19000;
      status.gateway.autoStart = config.gateway.autoStart !== false;
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Global config API error:', error);
    return NextResponse.json({ error: 'Failed to get global config' }, { status: 500 });
  }
}

// POST: 更新統一配置
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const config = getGlobalConfig() || {};
    
    // 更新對應的配置區塊
    if (body.apiKey) {
      config.models = config.models || {};
      config.models.providers = config.models.providers || {};
      const provider = body.apiKey.provider;
      config.models.providers[provider] = {
        ...config.models.providers[provider],
        apiKey: body.apiKey.key,
        defaultModel: body.apiKey.model || config.models.providers[provider]?.defaultModel,
      };
    }

    if (body.channels) {
      config.channels = { ...config.channels, ...body.channels };
    }

    if (body.gateway) {
      config.gateway = { ...config.gateway, ...body.gateway };
    }

    if (saveGlobalConfig(config)) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  } catch (error) {
    console.error('Global config update error:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
