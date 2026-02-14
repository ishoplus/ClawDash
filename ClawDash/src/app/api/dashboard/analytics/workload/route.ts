import { NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

interface WorkloadStats {
  totalSessions: number;
  totalMessages: number;
  totalTokens: number;
  avgSessionLength: number;
  topChannels: Record<string, number>;
  hourlyDistribution: number[];
  lastActivity: string;
}

// Get workload statistics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent') || 'code';

    const sessionsPath = `/Users/showang/.openclaw/agents/${agentId}/sessions/`;
    
    if (!existsSync(sessionsPath)) {
      return NextResponse.json({ stats: null });
    }

    const stats: WorkloadStats = {
      totalSessions: 0,
      totalMessages: 0,
      totalTokens: 0,
      avgSessionLength: 0,
      topChannels: {},
      hourlyDistribution: new Array(24).fill(0),
      lastActivity: ''
    };

    const files = readdirSync(sessionsPath).filter(f => f.endsWith('.jsonl'));
    let totalSessionTokens = 0;
    let sessionsWithTokens = 0;

    for (const file of files) {
      const filePath = join(sessionsPath, file);
      try {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());
        
        stats.totalSessions++;
        stats.totalMessages += lines.length;

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            
            // Token stats
            if (entry.tokens) {
              const tokens = (entry.tokens.input || 0) + (entry.tokens.output || 0);
              stats.totalTokens += tokens;
              totalSessionTokens += tokens;
              sessionsWithTokens++;
            }

            // Hourly distribution
            if (entry.timestamp || entry.time) {
              const hour = new Date(entry.timestamp || entry.time).getHours();
              stats.hourlyDistribution[hour]++;
            }

            // Last activity
            if (entry.timestamp || entry.time) {
              const time = new Date(entry.timestamp || entry.time).toISOString();
              if (!stats.lastActivity || time > stats.lastActivity) {
                stats.lastActivity = time;
              }
            }
          } catch {
            // Skip
          }
        }
      } catch {
        // Skip
      }
    }

    stats.avgSessionLength = sessionsWithTokens > 0 
      ? Math.round(totalSessionTokens / sessionsWithTokens) 
      : 0;

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching workload stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workload stats', stats: null },
      { status: 500 }
    );
  }
}
