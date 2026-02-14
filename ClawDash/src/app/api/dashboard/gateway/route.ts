import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Gateway control: status, restart, start, stop
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    let command = '';
    switch (action) {
      case 'status':
        command = 'openclaw gateway status';
        break;
      case 'health':
        command = 'openclaw gateway health';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use status or health' },
          { status: 400 }
        );
    }

    const { stdout, stderr } = await execAsync(command);
    
    // Try to parse JSON output
    let data;
    try {
      data = JSON.parse(stdout);
    } catch {
      data = { raw: stdout };
    }

    return NextResponse.json({ 
      success: true, 
      data,
      raw: stdout 
    });
  } catch (error) {
    console.error('Error with gateway action:', error);
    return NextResponse.json(
      { error: 'Failed to get gateway status' },
      { status: 500 }
    );
  }
}

// Gateway control actions
export async function POST(request: Request) {
  let action = '';
  try {
    const { searchParams } = new URL(request.url);
    action = searchParams.get('action') || ''; // 'restart', 'start', 'stop'

    if (!action || !['restart', 'start', 'stop'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use restart, start, or stop' },
        { status: 400 }
      );
    }

    const command = `openclaw gateway ${action}`;
    const { stdout, stderr } = await execAsync(command);

    return NextResponse.json({ 
      success: true, 
      message: `Gateway ${action} command executed`,
      raw: stdout || stderr
    });
  } catch (error) {
    console.error('Error with gateway action:', error);
    return NextResponse.json(
      { error: `Failed to ${action || 'perform'} gateway action` },
      { status: 500 }
    );
  }
}
