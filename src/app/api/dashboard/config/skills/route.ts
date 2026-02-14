import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OPENCLAW_SKILLS_PATH = '/Users/showang/.nvm/versions/node/v24.13.0/lib/node_modules/openclaw/skills';
const ENABLED_SKILLS_PATH = path.join(process.env.HOME || '/Users/showang', '.openclaw', 'enabled_skills.json');

// 風險等級定義 - 基於技能特性
const SKILL_RISK_DEFINITIONS: Record<string, { level: 'high' | 'medium' | 'low'; reason: string }> = {
  // 高風險技能 - 需要謹慎啟用
  'exec': { level: 'high', reason: '執行任意系統指令' },
  'shell': { level: 'high', reason: 'Shell 指令執行' },
  'coding-agent': { level: 'high', reason: '自動程式碼生成和修改' },
  'nano-pdf': { level: 'medium', reason: 'PDF 處理' },
  
  // 中等風險技能
  'github': { level: 'medium', reason: 'GitHub 仓库操作' },
  'gog': { level: 'medium', reason: 'Google Workspace 存取' },
  'discord': { level: 'medium', reason: 'Discord 訊息操作' },
  'blucli': { level: 'medium', reason: 'Bluetooth 設備控制' },
  'bluebubbles': { level: 'medium', reason: 'iMessage 存取' },
  
  // 低風險技能 - 安全的唯讀或資訊獲取技能
  'weather': { level: 'low', reason: '天氣查詢，無風險' },
  'apple-notes': { level: 'low', reason: 'Apple Notes 讀寫' },
  'apple-reminders': { level: 'low', reason: '提醒事項管理' },
  'bear-notes': { level: 'low', reason: 'Bear Notes 讀寫' },
  'model-usage': { level: 'low', reason: '模型使用統計' },
  'canvas': { level: 'low', reason: 'Canvas 渲染' },
  'gemini': { level: 'low', reason: 'Gemini API 查詢' },
};

function parseSkillYaml(content: string): { name: string; description: string; metadata: any } | null {
  try {
    // 解析 YAML frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return null;

    const frontmatter = match[1];
    const body = match[2];

    // 解析 frontmatter
    const frontData = JSON.parse(frontmatter.replace(/:\s*"([^"]*)"/g, ': "$1"').replace(/:\s*'([^']*)'/g, ': "$1"'));
    
    return {
      name: frontData.name,
      description: frontData.description || body.split('\n')[0],
      metadata: frontData.metadata || {}
    };
  } catch (e) {
    return null;
  }
}

function getRiskLevel(skillName: string): 'high' | 'medium' | 'low' {
  // 精確匹配
  if (SKILL_RISK_DEFINITIONS[skillName]) {
    return SKILL_RISK_DEFINITIONS[skillName].level;
  }
  
  // 前綴匹配
  for (const [prefix, def] of Object.entries(SKILL_RISK_DEFINITIONS)) {
    if (skillName.startsWith(prefix)) {
      return def.level;
    }
  }
  
  // 根據技能特性推斷風險
  const highRiskKeywords = ['exec', 'shell', 'delete', 'remove', 'install', 'modify', 'write', 'edit'];
  const mediumRiskKeywords = ['github', 'gog', 'discord', 'telegram', 'browser', 'node', 'cron'];
  
  if (highRiskKeywords.some(kw => skillName.includes(kw))) {
    return 'high';
  }
  if (mediumRiskKeywords.some(kw => skillName.includes(kw))) {
    return 'medium';
  }
  
  return 'medium'; // 預設為中等風險，需要使用者確認
}

function getRiskReason(skillName: string): string {
  if (SKILL_RISK_DEFINITIONS[skillName]) {
    return SKILL_RISK_DEFINITIONS[skillName].reason;
  }
  return '一般功能，風險取決於使用方式';
}

function getEnabledSkills(): string[] {
  try {
    if (fs.existsSync(ENABLED_SKILLS_PATH)) {
      const content = fs.readFileSync(ENABLED_SKILLS_PATH, 'utf-8');
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.error('Error reading enabled skills:', e);
  }
  return [];
}

function saveEnabledSkills(skills: string[]): boolean {
  try {
    // 確保目錄存在
    const dir = path.dirname(ENABLED_SKILLS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ENABLED_SKILLS_PATH, JSON.stringify(skills, null, 2));
    return true;
  } catch (e) {
    console.error('Error saving enabled skills:', e);
    return false;
  }
}

export async function GET() {
  try {
    const enabledSkills = getEnabledSkills();
    const allSkills: any[] = [];

    // 讀取所有已安裝的技能
    try {
      if (fs.existsSync(OPENCLAW_SKILLS_PATH)) {
        const dirs = fs.readdirSync(OPENCLAW_SKILLS_PATH).filter(f => {
          const skillPath = path.join(OPENCLAW_SKILLS_PATH, f);
          return fs.statSync(skillPath).isDirectory() && fs.existsSync(path.join(skillPath, 'SKILL.md'));
        });

        for (const skillName of dirs) {
          const skillPath = path.join(OPENCLAW_SKILLS_PATH, skillName);
          const skillFile = path.join(skillPath, 'SKILL.md');
          
          let description = skillName;
          let emoji = '🔧';
          
          try {
            const content = fs.readFileSync(skillFile, 'utf-8');
            const parsed = parseSkillYaml(content);
            if (parsed) {
              description = parsed.description;
              emoji = parsed.metadata?.openclaw?.emoji || '🔧';
            }
          } catch (e) {
            // 使用預設名稱
          }

          const riskLevel = getRiskLevel(skillName);
          const riskReason = getRiskReason(skillName);

          allSkills.push({
            name: skillName,
            description: description,
            emoji: emoji,
            riskLevel: riskLevel,
            riskReason: riskReason,
            enabled: enabledSkills.includes(skillName),
            installed: true
          });
        }
      }
    } catch (e) {
      console.error('Error reading skills directory:', e);
    }

    // 統計
    const stats = {
      total: allSkills.length,
      enabled: allSkills.filter(s => s.enabled).length,
      highRisk: allSkills.filter(s => s.riskLevel === 'high').length,
      mediumRisk: allSkills.filter(s => s.riskLevel === 'medium').length,
      lowRisk: allSkills.filter(s => s.riskLevel === 'low').length,
      highRiskEnabled: allSkills.filter(s => s.riskLevel === 'high' && s.enabled).length,
      mediumRiskEnabled: allSkills.filter(s => s.riskLevel === 'medium' && s.enabled).length,
      lowRiskEnabled: allSkills.filter(s => s.riskLevel === 'low' && s.enabled).length
    };

    // 分類技能
    const categorized = {
      high: allSkills.filter(s => s.riskLevel === 'high'),
      medium: allSkills.filter(s => s.riskLevel === 'medium'),
      low: allSkills.filter(s => s.riskLevel === 'low')
    };

    return NextResponse.json({ skills: allSkills, stats, categorized });
  } catch (error) {
    console.error('Skills GET error:', error);
    return NextResponse.json({ error: 'Failed to get skills' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, skills } = body;

    const enabledSkills = getEnabledSkills();

    if (action === 'enable') {
      // 啟用指定技能
      for (const skill of skills) {
        if (!enabledSkills.includes(skill)) {
          enabledSkills.push(skill);
        }
      }
    } else if (action === 'disable') {
      // 停用指定技能
      const toDisable = new Set(skills);
      const newEnabled = enabledSkills.filter(s => !toDisable.has(s));
      
      if (saveEnabledSkills(newEnabled)) {
        return NextResponse.json({ 
          success: true, 
          enabled: newEnabled,
          message: `${skills.length} skill(s) disabled` 
        });
      }
    } else if (action === 'set') {
      // 設置完整列表
      if (saveEnabledSkills(skills)) {
        return NextResponse.json({ 
          success: true, 
          enabled: skills,
          message: `Skills updated` 
        });
      }
    } else if (action === 'enableAllLow') {
      // 啟用所有低風險技能
      const lowRiskSkills = getLowRiskSkills();
      const newEnabled = [...new Set([...enabledSkills, ...lowRiskSkills])];
      if (saveEnabledSkills(newEnabled)) {
        return NextResponse.json({ 
          success: true, 
          enabled: newEnabled,
          message: `All low-risk skills enabled` 
        });
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (saveEnabledSkills(enabledSkills)) {
      return NextResponse.json({ 
        success: true, 
        enabled: enabledSkills,
        message: `${skills?.length || 0} skill(s) enabled` 
      });
    } else {
      return NextResponse.json({ error: 'Failed to save skills' }, { status: 500 });
    }
  } catch (error) {
    console.error('Skills POST error:', error);
    return NextResponse.json({ error: 'Failed to update skills' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const skill = searchParams.get('skill');

    if (!skill) {
      return NextResponse.json({ error: 'Skill name is required' }, { status: 400 });
    }

    const enabledSkills = getEnabledSkills();
    const newEnabled = enabledSkills.filter(s => s !== skill);

    if (saveEnabledSkills(newEnabled)) {
      return NextResponse.json({ success: true, message: `${skill} disabled` });
    }

    return NextResponse.json({ error: 'Failed to disable skill' }, { status: 500 });
  } catch (error) {
    console.error('Skills DELETE error:', error);
    return NextResponse.json({ error: 'Failed to disable skill' }, { status: 500 });
  }
}

function getLowRiskSkills(): string[] {
  try {
    if (fs.existsSync(OPENCLAW_SKILLS_PATH)) {
      const dirs = fs.readdirSync(OPENCLAW_SKILLS_PATH).filter(f => {
        const skillPath = path.join(OPENCLAW_SKILLS_PATH, f);
        return fs.statSync(skillPath).isDirectory() && 
               fs.existsSync(path.join(skillPath, 'SKILL.md')) &&
               getRiskLevel(f) === 'low';
      });
      return dirs;
    }
  } catch (e) {
    console.error('Error getting low risk skills:', e);
  }
  return [];
}
