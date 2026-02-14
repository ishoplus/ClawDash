import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface AgentConfig {
  model?: string;
  systemPrompt?: string;
  enabledSkills?: string[];
  customSettings?: Record<string, any>;
}

const WORKSPACE_PATH = path.join(process.env.HOME || '/Users/showang', '.openclaw', 'workspaces');

// 取得 Agent 配置目錄
function getAgentPath(agentId: string): string {
  return path.join(WORKSPACE_PATH, agentId);
}

// 讀取 Agent 專屬配置
function getAgentConfig(agentId: string): AgentConfig | null {
  try {
    const configPath = path.join(getAgentPath(agentId), 'agent.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (e) {
    console.error(`Error reading agent ${agentId} config:`, e);
  }
  return null;
}

// 儲存 Agent 專屬配置
function saveAgentConfig(agentId: string, config: AgentConfig): boolean {
  try {
    const configPath = path.join(getAgentPath(agentId), 'agent.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (e) {
    console.error(`Error saving agent ${agentId} config:`, e);
    return false;
  }
}

// GET: 取得 Agent 專屬配置
export async function GET(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const config = getAgentConfig(agentId);
    
    // 取得該 Agent 的技能列表
    const skillsPath = path.join(process.env.HOME || '/Users/showang', '.openclaw', 'skills');
    const enabledSkillsPath = path.join(process.env.HOME || '/Users/showang', '.openclaw', 'enabled_skills.json');
    
    let availableSkills: string[] = [];
    let enabledSkills: string[] = [];
    
    try {
      if (fs.existsSync(skillsPath)) {
        availableSkills = fs.readdirSync(skillsPath).filter(f => 
          fs.statSync(path.join(skillsPath, f)).isDirectory()
        );
      }
      if (fs.existsSync(enabledSkillsPath)) {
        enabledSkills = JSON.parse(fs.readFileSync(enabledSkillsPath, 'utf-8'));
      }
    } catch (e) {
      // Skills 可能不存在
    }

    return NextResponse.json({
      agentId,
      config: config || {},
      skills: {
        available: availableSkills,
        enabled: config?.enabledSkills || enabledSkills,
      },
      // Agent 專屬的統計
      stats: {
        hasWorkspace: fs.existsSync(path.join(getAgentPath(agentId))),
        hasAgentConfig: !!config,
      }
    });
  } catch (error) {
    console.error('Agent config API error:', error);
    return NextResponse.json({ error: 'Failed to get agent config' }, { status: 500 });
  }
}

// POST: 更新 Agent 專屬配置
export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const body = await request.json();
    
    const currentConfig = getAgentConfig(agentId) || {};
    const updatedConfig: AgentConfig = {
      ...currentConfig,
      ...body,
    };

    if (saveAgentConfig(agentId, updatedConfig)) {
      return NextResponse.json({ success: true, config: updatedConfig });
    }
    return NextResponse.json({ error: 'Failed to save agent config' }, { status: 500 });
  } catch (error) {
    console.error('Agent config update error:', error);
    return NextResponse.json({ error: 'Failed to update agent config' }, { status: 500 });
  }
}

// DELETE: 重置 Agent 專屬配置
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const configPath = path.join(getAgentPath(agentId), 'agent.json');
    
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      return NextResponse.json({ success: true, message: `已重置 ${agentId} 的配置` });
    }
    return NextResponse.json({ error: 'Config not found' }, { status: 404 });
  } catch (error) {
    console.error('Agent config delete error:', error);
    return NextResponse.json({ error: 'Failed to delete agent config' }, { status: 500 });
  }
}
