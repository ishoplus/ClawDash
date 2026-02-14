import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.env.HOME || '/Users/showang', '.openclaw', 'openclaw.json');

interface OpenClawConfig {
  channels?: {
    telegram?: {
      accounts?: Record<string, { 
        botToken?: string; 
        enabled?: boolean;
        dmPolicy?: string;
        groupPolicy?: string;
        streamMode?: string;
        allowFrom?: string[];
      }>;
      enabled?: boolean;
    };
    whatsapp?: { 
      token?: string; 
      enabled?: boolean;
      [key: string]: any;
    };
    discord?: { 
      token?: string; 
      enabled?: boolean;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
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

export async function GET() {
  try {
    const config = getOpenClawConfig();
    const channels = config.channels || {};

    // 返回通道配置狀態
    const channelStatus: Record<string, any> = {};
    
    // Telegram - 檢查 accounts
    if (channels.telegram?.accounts) {
      const accounts = channels.telegram.accounts;
      const accountNames = Object.keys(accounts);
      channelStatus.telegram = {
        configured: accountNames.length > 0,
        enabled: channels.telegram.enabled !== false,
        accounts: accountNames.length,
        hasToken: accountNames.some(name => accounts[name]?.botToken)
      };
    } else {
      channelStatus.telegram = {
        configured: false,
        enabled: false,
        accounts: 0,
        hasToken: false
      };
    }

    // WhatsApp
    if (channels.whatsapp?.token) {
      channelStatus.whatsapp = {
        configured: true,
        enabled: channels.whatsapp.enabled !== false,
        hasToken: true
      };
    } else {
      channelStatus.whatsapp = {
        configured: false,
        enabled: false,
        hasToken: false
      };
    }

    // Discord
    if (channels.discord?.token) {
      channelStatus.discord = {
        configured: true,
        enabled: channels.discord.enabled !== false,
        hasToken: true
      };
    } else {
      channelStatus.discord = {
        configured: false,
        enabled: false,
        hasToken: false
      };
    }

    return NextResponse.json({ channels: channelStatus });
  } catch (error) {
    console.error('Channels GET error:', error);
    return NextResponse.json({ error: 'Failed to get channel status' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channel, token, config: channelConfig } = body;

    if (!channel || !token) {
      return NextResponse.json({ error: 'Channel and token are required' }, { status: 400 });
    }

    const openclawConfig = getOpenClawConfig();
    
    if (!openclawConfig.channels) {
      openclawConfig.channels = {};
    }

    // 根據通道類型設置配置
    if (channel === 'telegram') {
      // Telegram: 創建預設 account
      if (!openclawConfig.channels.telegram) {
        openclawConfig.channels.telegram = {
          enabled: true,
          accounts: {}
        };
      }
      // 使用 "default" 作為帳戶名稱
      openclawConfig.channels.telegram.accounts = openclawConfig.channels.telegram.accounts || {};
      openclawConfig.channels.telegram.accounts['default'] = {
        botToken: token,
        enabled: true,
        dmPolicy: 'allowlist',
        groupPolicy: 'allowlist'
      };
    } else if (channel === 'whatsapp') {
      openclawConfig.channels.whatsapp = {
        token: token,
        enabled: true,
        ...channelConfig
      };
    } else if (channel === 'discord') {
      openclawConfig.channels.discord = {
        token: token,
        enabled: true,
        ...channelConfig
      };
    } else {
      return NextResponse.json({ error: 'Unsupported channel' }, { status: 400 });
    }

    if (saveOpenClawConfig(openclawConfig)) {
      return NextResponse.json({ 
        success: true, 
        message: `${channel} channel configured successfully` 
      });
    } else {
      return NextResponse.json({ error: 'Failed to save channel config' }, { status: 500 });
    }
  } catch (error) {
    console.error('Channels POST error:', error);
    return NextResponse.json({ error: 'Failed to save channel config' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    if (!channel) {
      return NextResponse.json({ error: 'Channel is required' }, { status: 400 });
    }

    const config = getOpenClawConfig();
    
    if (channel === 'telegram') {
      // Telegram: 清除所有 accounts
      if (config.channels?.telegram) {
        delete config.channels.telegram.accounts;
        if (saveOpenClawConfig(config)) {
          return NextResponse.json({ success: true, message: `${channel} channel removed` });
        }
      }
    } else if (config.channels?.[channel]) {
      delete config.channels[channel];
      if (saveOpenClawConfig(config)) {
        return NextResponse.json({ success: true, message: `${channel} channel removed` });
      }
    }

    return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  } catch (error) {
    console.error('Channels DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove channel' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { channel, enabled } = body;

    if (!channel || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Channel and enabled status are required' }, { status: 400 });
    }

    const config = getOpenClawConfig();
    
    if (channel === 'telegram') {
      if (config.channels?.telegram) {
        config.channels.telegram.enabled = enabled;
        if (saveOpenClawConfig(config)) {
          return NextResponse.json({ success: true, message: `${channel} ${enabled ? 'enabled' : 'disabled'}` });
        }
      }
    } else if (config.channels?.[channel]) {
      config.channels[channel].enabled = enabled;
      if (saveOpenClawConfig(config)) {
        return NextResponse.json({ success: true, message: `${channel} ${enabled ? 'enabled' : 'disabled'}` });
      }
    }

    return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  } catch (error) {
    console.error('Channels PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 });
  }
}
