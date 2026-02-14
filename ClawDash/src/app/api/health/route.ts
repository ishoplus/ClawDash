import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Health check for OpenClaw environment
export async function GET() {
  const checks = {
    openclaw: {
      installed: false,
      version: null as string | null,
      path: null as string | null,
    },
    gateway: {
      running: false,
      port: null as number | null,
      pid: null as number | null,
    },
    workspace: {
      exists: false,
      path: null as string | null,
      agents: [] as string[],
    },
    node: {
      version: null as string | null,
    },
  };

  try {
    // Check OpenCLaw CLI
    try {
      const { stdout } = await execAsync('which openclaw');
      checks.openclaw.path = stdout.trim();
      
      const { stdout: version } = await execAsync('openclaw --version');
      checks.openclaw.version = version.trim();
      checks.openclaw.installed = true;
    } catch {
      checks.openclaw.installed = false;
    }

    // Check Gateway status
    try {
      const { stdout } = await execAsync('openclaw gateway status');
      const portMatch = stdout.match(/port[:\s]+(\d+)/i);
      const pidMatch = stdout.match(/pid[:\s]+(\d+)/i);
      const runningMatch = stdout.match(/runtime:\s+(\w+)/i);
      
      if (runningMatch && runningMatch[1] === 'running') {
        checks.gateway.running = true;
      }
      if (portMatch) {
        checks.gateway.port = parseInt(portMatch[1]);
      }
      if (pidMatch) {
        checks.gateway.pid = parseInt(pidMatch[1]);
      }
    } catch {
      checks.gateway.running = false;
    }

    // Check workspace
    try {
      const { stdout } = await execAsync('ls -1 ~/.openclaw/workspaces/');
      const agents = stdout.trim().split('\n').filter(a => a && !a.startsWith('.'));
      
      checks.workspace.exists = true;
      checks.workspace.path = '~/.openclaw/workspaces/';
      checks.workspace.agents = agents;
    } catch {
      checks.workspace.exists = false;
    }

    // Check Node.js
    try {
      const { stdout } = await execAsync('node --version');
      checks.node.version = stdout.trim();
    } catch {
      checks.node.version = null;
    }

    // Determine overall status
    const allPassed = checks.openclaw.installed && checks.gateway.running;
    
    return NextResponse.json({
      status: allPassed ? 'ready' : 'not_ready',
      checks,
      message: allPassed 
        ? '環境就緒，可以運行 Dashboard' 
        : '請確保 OpenClaw 和 Gateway 已正確安裝並運行'
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      error: '檢查過程發生錯誤',
      checks
    }, { status: 500 });
  }
}
