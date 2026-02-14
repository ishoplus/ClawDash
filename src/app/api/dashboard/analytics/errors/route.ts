import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source?: string;
}

// Parse log entries and extract errors/warnings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const level = searchParams.get('level') || 'error'; // error, warning, all

    // Get recent logs and filter for errors/warnings
    const command = `openclaw logs --limit 500`;
    const { stdout, stderr } = await execAsync(command, { maxBuffer: 2 * 1024 * 1024 });

    const allLogs = (stdout + stderr).split('\n').filter(l => l.trim());
    
    const now = Date.now();
    const cutoff = now - hours * 60 * 60 * 1000;
    
    const events: LogEntry[] = [];
    const errorPatterns = ['error', 'Error', 'ERROR', 'fail', 'Fail', 'FAIL', 'exception', 'Exception'];
    const warningPatterns = ['warn', 'Warn', 'WARN', 'warning', 'Warning'];

    for (const line of allLogs) {
      const timestampMatch = line.match(/^[\d\-T:\.Z]+/);
      const timestamp = timestampMatch ? timestampMatch[0] : '';
      const logTime = timestamp ? new Date(timestamp).getTime() : now;

      if (logTime < cutoff) continue;

      const isError = errorPatterns.some(p => line.includes(p));
      const isWarning = warningPatterns.some(p => line.includes(p));

      if (level === 'error' && !isError) continue;
      if (level === 'warning' && !isError && !isWarning) continue;

      if (level === 'all' && !isError && !isWarning) continue;

      // Extract source/component
      const sourceMatch = line.match(/\[([^\]]+)\]/);
      const source = sourceMatch ? sourceMatch[1] : undefined;

      events.push({
        timestamp: timestamp || new Date().toISOString(),
        level: isError ? 'error' : 'warning',
        message: line,
        source
      });
    }

    // Sort by timestamp descending and limit
    events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const limited = events.slice(0, 50);

    return NextResponse.json({ 
      events: limited,
      count: limited.length,
      total: events.length
    });
  } catch (error) {
    console.error('Error fetching error logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error logs', events: [] },
      { status: 500 }
    );
  }
}
