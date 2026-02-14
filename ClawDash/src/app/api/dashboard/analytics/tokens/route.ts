import { NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface TokenDataPoint {
  date: string;
  input: number;
  output: number;
  total: number;
  sessions: number;
}

// Get token usage over time
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent') || 'code';
    const period = searchParams.get('period') || '7d'; // 7d, 30d, all

    const sessionsPath = `/Users/showang/.openclaw/agents/${agentId}/sessions/`;
    
    if (!existsSync(sessionsPath)) {
      return NextResponse.json({ data: [] });
    }

    const tokenData: TokenDataPoint[] = [];
    const now = Date.now();
    
    // Calculate date range
    let startTime = now;
    switch (period) {
      case '7d':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        startTime = 0;
    }

    // Read all session files
    const files = readdirSync(sessionsPath).filter(f => f.endsWith('.jsonl'));
    
    // Aggregate by date
    const dailyTokens: Record<string, { input: number; output: number; sessions: Set<string> }> = {};

    for (const file of files) {
      const filePath = join(sessionsPath, file);
      try {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            const timestamp = entry.timestamp || entry.time;
            
            if (!timestamp) continue;
            
            const date = new Date(timestamp).toISOString().split('T')[0];
            
            if (!dailyTokens[date]) {
              dailyTokens[date] = { input: 0, output: 0, sessions: new Set() };
            }

            if (entry.tokens) {
              dailyTokens[date].input += entry.tokens.input || 0;
              dailyTokens[date].output += entry.tokens.output || 0;
            }
            
            if (entry.sessionId) {
              dailyTokens[date].sessions.add(entry.sessionId);
            }
          } catch {
            // Skip malformed lines
          }
        }
      } catch {
        // Skip unreadable files
      }
    }

    // Convert to array and sort by date
    const result = Object.entries(dailyTokens)
      .filter(([date]) => new Date(date).getTime() >= startTime)
      .map(([date, data]) => ({
        date,
        input: data.input,
        output: data.output,
        total: data.input + data.output,
        sessions: data.sessions.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching token trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token trends', data: [] },
      { status: 500 }
    );
  }
}
