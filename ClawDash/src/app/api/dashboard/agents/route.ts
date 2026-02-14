import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  displayName: string;
}

export async function GET() {
  try {
    const { stdout } = await execAsync('ls -1 /Users/showang/.openclaw/workspaces/');
    const workspaces = stdout.trim().split('\n').filter(w => 
      w && !w.startsWith('.') && w !== ''
    );
    
    const agents: AgentInfo[] = workspaces.map(ws => ({
      id: ws,
      name: ws.charAt(0).toUpperCase() + ws.slice(1),
      role: 'Agent',
      displayName: `${ws.charAt(0).toUpperCase() + ws.slice(1)} Agent`,
    }));
    
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json([
      { id: 'code', name: 'Code', role: '開發工程師', displayName: 'Code (开发助手)' },
      { id: 'rich', name: 'Rich', role: '通用助手', displayName: 'Rich Agent' },
    ]);
  }
}
