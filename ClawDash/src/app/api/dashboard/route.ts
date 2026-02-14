import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { parseLsOutput } from '../../../lib/parseLsOutput';
import { validateWorkspacePath } from '../../../lib/validatePath';
import type { DashboardData, WorkspaceFile, SessionInfo, CronJob } from '../../../lib/types';

// Re-export types for backward compatibility
export type { DashboardData, WorkspaceFile, SessionInfo, CronJob };

const execAsync = promisify(exec);

// Agent configurations
const agentConfigs: Record<string, { name: string; role: string; displayName: string }> = {
  code: {
    name: 'Code',
    role: '開發工程師',
    displayName: 'Code (开发助手)',
  },
  main: {
    name: 'Main',
    role: '主代理',
    displayName: 'Main Agent',
  },
  rich: {
    name: 'Rich',
    role: '通用助手',
    displayName: 'Rich',
  },
};

// Get available agents dynamically
async function getAvailableAgents(): Promise<{ id: string; name: string; role: string; displayName: string }[]> {
  try {
    const { stdout } = await execAsync('ls -1 /Users/showang/.openclaw/workspaces/');
    const workspaces = stdout.trim().split('\n').filter(w => 
      w && !w.startsWith('.') && w !== ''
    );
    
    const agents = workspaces.map(ws => ({
      id: ws,
      name: ws.charAt(0).toUpperCase() + ws.slice(1),
      role: 'Agent',
      displayName: `${ws.charAt(0).toUpperCase() + ws.slice(1)} Agent`,
    }));
    
    return agents.length > 0 ? agents : Object.entries(agentConfigs).map(([id, cfg]) => ({
      id,
      ...cfg,
    }));
  } catch {
    return Object.entries(agentConfigs).map(([id, cfg]) => ({
      id,
      ...cfg,
    }));
  }
}

// Get sessions from all agents by reading their sessions.json files
async function getSessions(): Promise<any[]> {
  const allSessions: any[] = [];
  const agentsPath = '/Users/showang/.openclaw/agents/';
  
  try {
    const { stdout } = await execAsync(`ls -1 "${agentsPath}"`);
    const agents = stdout.trim().split('\n').filter(a => a && !a.startsWith('.'));
    
    for (const agent of agents) {
      try {
        const sessionsFile = `${agentsPath}${agent}/sessions/sessions.json`;
        const { stdout: fileContent } = await execAsync(`cat "${sessionsFile}"`);
        const sessionsData = JSON.parse(fileContent);
        
        for (const [key, data] of Object.entries(sessionsData) as [string, any][]) {
          allSessions.push({
            key,
            kind: data.kind || 'direct',
            updatedAt: data.updatedAt,
            sessionId: data.sessionId,
            inputTokens: data.inputTokens || 0,
            outputTokens: data.outputTokens || 0,
            totalTokens: data.totalTokens || 0,
            model: data.model || 'unknown',
            contextTokens: data.contextTokens || 0,
            agentId: agent
          });
        }
      } catch {
        // Skip agents without sessions
      }
    }
  } catch (error) {
    console.error('Error fetching sessions:', error);
  }
  
  return allSessions;
}

// Get cron jobs from OpenClaw CLI
async function getCronJobs(): Promise<any[]> {
  try {
    const { stdout } = await execAsync('openclaw cron list --json');
    const result = JSON.parse(stdout);
    return result.jobs || [];
  } catch (error) {
    console.error('Error fetching cron jobs:', error);
    return [];
  }
}

// Get workspace files for a specific agent
async function getWorkspaceFiles(agentId: string): Promise<WorkspaceFile[]> {
  // Try to get agent's workspace
  const workspacePath = `/Users/showang/.openclaw/workspaces/${agentId}/`;
  try {
    // Check if directory exists
    await execAsync(`ls -d "${workspacePath}"`);
    const { stdout } = await execAsync(`ls -la "${workspacePath}"`);
    return parseLsOutput(stdout);
  } catch (error) {
    // Fallback to code workspace if agent workspace doesn't exist
    console.log(`Workspace for ${agentId} not found, using code workspace`);
    try {
      const { stdout } = await execAsync('ls -la /Users/showang/.openclaw/workspaces/code/');
      return parseLsOutput(stdout);
    } catch {
      return [];
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent') || 'code';
    const config = agentConfigs[agentId] || agentConfigs['code'];
    
    // Fetch all data in parallel
    const [sessions, cronJobs, workspaceFiles] = await Promise.all([
      getSessions(),
      getCronJobs(),
      getWorkspaceFiles(agentId),
    ]);
    
    // Filter sessions for the selected agent
    const agentSessions = sessions.filter((s: any) => 
      s.key.startsWith(`agent:${agentId}:`)
    );
    const selectedSession = agentSessions.find((s: any) => 
      s.key === `agent:${agentId}:main`
    ) || agentSessions[0];
    
    const dashboardData: DashboardData = {
      agent: {
        name: config.name,
        role: config.role,
        model: selectedSession?.model || 'unknown',
        sessionKey: `agent:${agentId}:main`,
        tokenUsage: {
          input: selectedSession?.inputTokens || 0,
          output: selectedSession?.outputTokens || 0,
          total: selectedSession?.totalTokens || 0,
        },
        context: 'dynamic',
        channel: 'telegram',
        displayName: config.displayName,
      },
      workspace: workspaceFiles,
      activeSessions: sessions.map((s: any) => {
        const keyParts = s.key.split(':');
        const sessionAgentId = keyParts[1] || 'unknown';
        return {
          key: s.key,
          kind: s.kind,
          agentId: sessionAgentId,
          channel: 'telegram',
          displayName: sessionAgentId === agentId 
            ? `${config.name} (当前)` 
            : sessionAgentId.charAt(0).toUpperCase() + sessionAgentId.slice(1),
          updatedAt: new Date(s.updatedAt).toLocaleString('zh-TW'),
          model: s.model || 'unknown',
          contextTokens: s.inputTokens || 0,
          totalTokens: s.totalTokens || s.outputTokens || 0,
        };
      }),
      cronJobs: cronJobs.map((job: any) => ({
        id: job.id,
        name: job.name || 'Unnamed Job',
        enabled: job.enabled,
        schedule: job.schedule || { kind: 'unknown' },
        sessionTarget: job.sessionTarget || 'unknown',
        nextRunAt: job.state?.nextRunAtMs 
          ? new Date(job.state.nextRunAtMs).toLocaleString('zh-TW')
          : undefined,
        model: job.payload?.model || null,
      })),
    };
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching OpenClaw data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch OpenClaw data' },
      { status: 500 }
    );
  }
}
