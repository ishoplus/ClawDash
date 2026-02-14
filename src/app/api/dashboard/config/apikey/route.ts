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
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function getOpenClawConfig(): OpenClawConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading config:', e);
  }
  return {};
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

interface ProviderStatus {
  configured: boolean;
  defaultModel?: string;
}

export async function GET() {
  try {
    const config = getOpenClawConfig();
    
    // 返回已配置的 provider（不返回 API Key）
    const providers: Record<string, ProviderStatus> = {};
    
    // 檢查 minimax-portal
    if (config.models?.providers?.['minimax-portal']?.apiKey && 
        config.models.providers['minimax-portal'].apiKey !== 'minimax-oauth') {
      providers['minimax-portal'] = {
        configured: true,
        defaultModel: 'MiniMax-M2.1'
      };
    }
    // 檢查 Anthropic
    if (config.models?.providers?.anthropic?.apiKey) {
      providers.anthropic = {
        configured: true,
        defaultModel: config.models.providers.anthropic.defaultModel || 'claude-sonnet-4'
      };
    }
    // 檢查 OpenAI
    if (config.models?.providers?.openai?.apiKey) {
      providers.openai = {
        configured: true,
        defaultModel: config.models.providers.openai.defaultModel || 'gpt-4o'
      };
    }
    // 檢查 Google
    if (config.models?.providers?.google?.apiKey) {
      providers.google = {
        configured: true,
        defaultModel: config.models.providers.google.defaultModel || 'gemini-2.0-flash'
      };
    }

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('API Key GET error:', error);
    return NextResponse.json({ error: 'Failed to get API Key config' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, apiKey, model } = body;

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider and API Key are required' }, { status: 400 });
    }

    const config = getOpenClawConfig();
    
    // 初始化 models.providers 結構
    if (!config.models) {
      config.models = {};
    }
    if (!config.models.providers) {
      config.models.providers = {};
    }

    // 設置 API Key
    switch (provider) {
      case 'anthropic':
        config.models.providers.anthropic = {
          apiKey: apiKey,
          defaultModel: model || 'claude-sonnet-4'
        };
        break;
      case 'openai':
        config.models.providers.openai = {
          apiKey: apiKey,
          defaultModel: model || 'gpt-4o'
        };
        break;
      case 'google':
        config.models.providers.google = {
          apiKey: apiKey,
          defaultModel: model || 'gemini-2.0-flash'
        };
        break;
      default:
        return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    if (saveOpenClawConfig(config)) {
      return NextResponse.json({ success: true, message: `${provider} API Key configured successfully` });
    } else {
      return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }
  } catch (error) {
    console.error('API Key POST error:', error);
    return NextResponse.json({ error: 'Failed to save API Key' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const config = getOpenClawConfig();
    
    if (config.models?.providers?.[provider]) {
      delete config.models.providers[provider];
      if (saveOpenClawConfig(config)) {
        return NextResponse.json({ success: true, message: `${provider} API Key removed` });
      }
    }

    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  } catch (error) {
    console.error('API Key DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove API Key' }, { status: 500 });
  }
}
