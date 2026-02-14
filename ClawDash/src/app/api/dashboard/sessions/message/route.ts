import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Send message to an existing session
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionKey, message } = body;

    if (!sessionKey || !message) {
      return NextResponse.json(
        { error: 'Session key and message are required' },
        { status: 400 }
      );
    }

    // Extract agent ID and session ID from key (format: agent:code:main or agent:code:sessionId)
    const parts = sessionKey.split(':');
    const agentId = parts[1]; // 'code', 'main', 'rich'
    const sessionId = parts[parts.length - 1]; // 'main' or UUID

    // Build the command - use --agent flag to target specific agent
    let cmd = `openclaw agent --agent "${agentId}" --message "${message.replace(/"/g, '\\"')}"`;
    
    // Only add session-id if it's a UUID (not 'main')
    if (sessionId !== 'main') {
      cmd += ` --session-id "${sessionId}"`;
    }
    
    cmd += ' --json';

    // Execute OpenClaw CLI to send message
    const { stdout, stderr } = await execAsync(cmd);

    if (stderr && !stderr.includes('warning')) {
      console.error('Error sending message:', stderr);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    let result;
    try {
      result = JSON.parse(stdout);
    } catch {
      result = { raw: stdout };
    }

    return NextResponse.json({ 
      success: true, 
      result 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
