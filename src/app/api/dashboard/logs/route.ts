import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get gateway logs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lines = parseInt(searchParams.get('lines') || '50');
    const filter = searchParams.get('filter') || '';

    let command = `openclaw logs --limit ${lines}`;
    
    if (filter) {
      command += ` | grep -i "${filter}"`;
    }

    const { stdout, stderr } = await execAsync(command, { maxBuffer: 1024 * 1024 });

    const logLines = (stdout + stderr)
      .split('\n')
      .filter(line => line.trim())
      .slice(-lines);

    return NextResponse.json({ 
      logs: logLines,
      count: logLines.length
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', logs: [] },
      { status: 500 }
    );
  }
}
