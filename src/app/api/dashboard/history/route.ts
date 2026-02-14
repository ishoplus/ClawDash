import { NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SessionContentBlock {
  type: string;
  text?: string;
}

interface SessionMessageEntry {
  message?: {
    role: string;
    content?: string | SessionContentBlock[] | { text?: string };
    timestamp?: string;
  };
  timestamp?: string;
  tokens?: { input?: number; output?: number };
}

interface SessionInfo {
  sessionFile?: string;
  sessionId?: string;
  updatedAt?: string;
  lastChannel?: string;
  lastTo?: string;
}

interface SessionSummary {
  key: string;
  sessionId: string;
  updatedAt: string;
  channel: string;
  lastTo: string;
  messageCount: number;
  inputTokens: number;
  outputTokens: number;
}

interface SessionMessage {
  role: string;
  content: string;
  timestamp?: string;
  tokens?: { input?: number; output?: number };
}

// Helper function to get messages for a specific session
async function handleSessionMessages(sessionKey: string) {
  try {
    // Parse the key to get agent ID
    const keyParts = sessionKey.split(':');
    const targetAgent = keyParts[1] || 'code';
    
    // Try each agent to find the session
    const agentsPath = '/Users/showang/.openclaw/agents/';
    let sessionInfo: SessionInfo | null = null;
    let actualAgent = targetAgent;
    
    // First try the target agent
    const targetPath = `${agentsPath}${targetAgent}/sessions/sessions.json`;
    if (existsSync(targetPath)) {
      try {
        const data = JSON.parse(readFileSync(targetPath, 'utf-8'));
        if (data[sessionKey]) {
          sessionInfo = data[sessionKey];
          actualAgent = targetAgent;
        }
      } catch { /* skip */ }
    }
    
    // If not found, search in all agents
    if (!sessionInfo) {
      try {
        const { stdout } = await execAsync(`ls -1 "${agentsPath}"`);
        const agents = stdout.trim().split('\n').filter((a: string) => a && !a.startsWith('.'));
        
        for (const a of agents) {
          if (a === targetAgent) continue;
          const keyPath = `${agentsPath}${a}/sessions/sessions.json`;
          if (existsSync(keyPath)) {
            try {
              const data = JSON.parse(readFileSync(keyPath, 'utf-8'));
              if (data[sessionKey]) {
                sessionInfo = data[sessionKey];
                actualAgent = a;
                break;
              }
            } catch { /* skip */ }
          }
        }
      } catch { /* skip */ }
    }
    
    if (!sessionInfo) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Try to find the session file
    let sessionFile = sessionInfo.sessionFile;
    
    // If sessionFile is not in sessionInfo, try to find it by sessionId
    if (!sessionFile || !existsSync(sessionFile)) {
      const sessionId = sessionInfo.sessionId;
      if (sessionId) {
        const sessionsDir = `${agentsPath}${actualAgent}/sessions/`;
        try {
          const { stdout } = await execAsync(`ls -1 "${sessionsDir}"`);
          const files = stdout.trim().split('\n');
          const matchingFile = files.find((f: string) => f.startsWith(sessionId) && f.endsWith('.jsonl'));
          if (matchingFile) {
            sessionFile = `${sessionsDir}${matchingFile}`;
          }
        } catch { /* skip */ }
      }
    }
    
    if (!sessionFile || !existsSync(sessionFile)) {
      return NextResponse.json({ messages: [], session: sessionInfo });
    }

    // Read the JSONL file and parse messages
    const messages: SessionMessage[] = [];
    const fileContent = readFileSync(sessionFile, 'utf-8');
    const lines = fileContent.split('\n').filter((line: string) => line.trim());

    for (const line of lines) {
      try {
        const entry: SessionMessageEntry = JSON.parse(line);
        if (entry.message) {
          let content = '';
          if (entry.message.content) {
            if (typeof entry.message.content === 'string') {
              content = entry.message.content;
            } else if (Array.isArray(entry.message.content)) {
              content = entry.message.content.map((block: SessionContentBlock) => block.text || '').join('');
            } else if (entry.message.content.text) {
              content = entry.message.content.text;
            }
          }
          if (!content) content = '[無內容]';
          
          messages.push({
            role: entry.message.role,
            content: content.substring(0, 500),
            timestamp: entry.message.timestamp || entry.timestamp,
            tokens: entry.tokens
          });
        }
      } catch { /* skip */ }
    }

    return NextResponse.json({ 
      session: sessionInfo,
      messages: messages.slice(-50)
    });
  } catch (error) {
    console.error('Error fetching session messages:', error);
    return NextResponse.json({ error: 'Failed to fetch session messages' }, { status: 500 });
  }
}

// Get list of sessions for an agent (or all agents)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent');
    const sessionKey = searchParams.get('key');

    // If a specific session key is provided, return that session's messages (ignore agentId)
    if (sessionKey) {
      return handleSessionMessages(sessionKey);
    }

    // If no agent specified, fetch all agents' sessions
    if (!agentId) {
      const allSessions: SessionSummary[] = [];
      const agentsPath = '/Users/showang/.openclaw/agents/';
      
      try {
        const { stdout } = await execAsync(`ls -1 "${agentsPath}"`);
        const agents = stdout.trim().split('\n').filter(a => a && !a.startsWith('.'));
        
        for (const agent of agents) {
          try {
            const sessionsFile = `${agentsPath}${agent}/sessions/sessions.json`;
            const { stdout: fileContent } = await execAsync(`cat "${sessionsFile}"`);
            const sessionsData = JSON.parse(fileContent);
            
            for (const [key, data] of Object.entries(sessionsData) as [string, SessionInfo][]) {
              let messageCount = 0;
              let inputTokens = 0;
              let outputTokens = 0;
              
              if (data.sessionFile && existsSync(data.sessionFile)) {
                try {
                  const fileContent = readFileSync(data.sessionFile, 'utf-8');
                  const lines = fileContent.split('\n').filter(line => line.trim());
                  messageCount = lines.length;
                  
                  for (const line of lines) {
                    try {
                      const entry = JSON.parse(line);
                      if (entry.tokens) {
                        inputTokens += entry.tokens.input || 0;
                        outputTokens += entry.tokens.output || 0;
                      }
                    } catch { /* skip */ }
                  }
                } catch { /* skip */ }
              }
              
              allSessions.push({
                key,
                sessionId: data.sessionId,
                updatedAt: new Date(data.updatedAt).toLocaleString('zh-TW'),
                channel: data.lastChannel || 'unknown',
                lastTo: data.lastTo || 'unknown',
                messageCount,
                inputTokens,
                outputTokens
              });
            }
          } catch { /* skip */ }
        }
      } catch { /* skip */ }
      
      // Sort by updated time descending
      allSessions.sort((a, b) => {
        const dataA = allSessions.find(s => s.key === a.key);
        const dataB = allSessions.find(s => s.key === b.key);
        return (dataB?.inputTokens || 0) - (dataA?.inputTokens || 0);
      });
      
      return NextResponse.json({ sessions: allSessions });
    }

    const sessionsPath = `/Users/showang/.openclaw/agents/${agentId}/sessions/sessions.json`;

    if (!existsSync(sessionsPath)) {
      return NextResponse.json({ sessions: [] });
    }

    const sessionsData = JSON.parse(readFileSync(sessionsPath, 'utf-8'));

    // If a specific session key is provided, return that session's messages
    if (sessionKey) {
      // Parse the key to get agent ID
      const keyParts = sessionKey.split(':');
      const targetAgent = keyParts[1] || 'code';
      const sessionsPathForKey = `/Users/showang/.openclaw/agents/${targetAgent}/sessions/sessions.json`;
      
      let sessionInfo: SessionInfo | null = null;
      let actualAgent = targetAgent;
      
      // Try to find the session in the target agent's sessions.json
      if (existsSync(sessionsPathForKey)) {
        try {
          const data = JSON.parse(readFileSync(sessionsPathForKey, 'utf-8'));
          sessionInfo = data[sessionKey];
          if (sessionInfo) {
            actualAgent = targetAgent;
          }
        } catch { /* skip */ }
      }
      
      // If not found, search in all agents
      if (!sessionInfo) {
        const agentsPath = '/Users/showang/.openclaw/agents/';
        try {
          const { stdout } = await execAsync(`ls -1 "${agentsPath}"`);
          const agents = stdout.trim().split('\n').filter(a => a && !a.startsWith('.'));
          
          for (const a of agents) {
            if (a === targetAgent) continue;
            const keyPath = `${agentsPath}${a}/sessions/sessions.json`;
            if (existsSync(keyPath)) {
              try {
                const data = JSON.parse(readFileSync(keyPath, 'utf-8'));
                if (data[sessionKey]) {
                  sessionInfo = data[sessionKey];
                  actualAgent = a;
                  break;
                }
              } catch { /* skip */ }
            }
          }
        } catch { /* skip */ }
      }
      
      if (!sessionInfo) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      // Try to find the session file
      let sessionFile = sessionInfo.sessionFile;
      
      // If sessionFile is not in sessionInfo, try to find it by sessionId
      if (!sessionFile || !existsSync(sessionFile)) {
        const sessionId = sessionInfo.sessionId;
        if (sessionId) {
          const sessionsDir = `/Users/showang/.openclaw/agents/${actualAgent}/sessions/`;
          try {
            const { stdout } = await execAsync(`ls -1 "${sessionsDir}"`);
            const files = stdout.trim().split('\n');
            const matchingFile = files.find(f => f.startsWith(sessionId) && f.endsWith('.jsonl'));
            if (matchingFile) {
              sessionFile = `${sessionsDir}${matchingFile}`;
            }
          } catch { /* skip */ }
        }
      }
      
      if (!sessionFile || !existsSync(sessionFile)) {
        return NextResponse.json({ messages: [], session: sessionInfo });
      }

      // Read the JSONL file and parse messages
      const messages: SessionMessage[] = [];
      const fileContent = readFileSync(sessionFile, 'utf-8');
      const lines = fileContent.split('\n').filter((line: string) => line.trim());

      for (const line of lines) {
        try {
          const entry: SessionMessageEntry = JSON.parse(line);
          // Extract messages (both user and assistant)
          if (entry.message) {
            // Handle content as array or string
            let content = '';
            if (entry.message.content) {
              if (typeof entry.message.content === 'string') {
                content = entry.message.content;
              } else if (Array.isArray(entry.message.content)) {
                // Content is an array of blocks
                content = entry.message.content
                  .map((block: SessionContentBlock) => block.text || '')
                  .join('');
              } else if (entry.message.content.text) {
                content = entry.message.content.text;
              }
            }
            
            if (!content) content = '[無內容]';
            
            messages.push({
              role: entry.message.role,
              content: content.substring(0, 500),
              timestamp: entry.message.timestamp || entry.timestamp,
              tokens: entry.tokens
            });
          }
        } catch {
          // Skip malformed lines
        }
      }

      return NextResponse.json({ 
        session: sessionInfo,
        messages: messages.slice(-50) // Last 50 messages
      });
    }

    // Otherwise, return list of sessions
    interface RawSessionData {
      sessionFile?: string;
      sessionId?: string;
      updatedAt?: string | number | Date;
      lastChannel?: string;
      lastTo?: string;
    }
    
    const sessions: SessionSummary[] = (Object.entries(sessionsData) as [string, RawSessionData][]).map(([key, data]) => {
      // Try to count messages from session file
      let messageCount = 0;
      let inputTokens = 0;
      let outputTokens = 0;

      if (data.sessionFile && existsSync(data.sessionFile)) {
        try {
          const fileContent = readFileSync(data.sessionFile, 'utf-8');
          const lines = fileContent.split('\n').filter(line => line.trim());
          messageCount = lines.length;
          
          // Sum up tokens from all entries
          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              if (entry.tokens) {
                inputTokens += entry.tokens.input || 0;
                outputTokens += entry.tokens.output || 0;
              }
            } catch {
              // Skip
            }
          }
        } catch {
          // Ignore
        }
      }

      return {
        key,
        sessionId: data.sessionId || '',
        updatedAt: data.updatedAt ? new Date(data.updatedAt).toLocaleString('zh-TW') : '未知',
        channel: data.lastChannel || 'unknown',
        lastTo: data.lastTo || 'unknown',
        messageCount,
        inputTokens,
        outputTokens
      };
    });

    // Sort by updated time descending
    sessions.sort((a, b) => {
      const dataA = sessionsData[a.key];
      const dataB = sessionsData[b.key];
      return (dataB?.updatedAt || 0) - (dataA?.updatedAt || 0);
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching session history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session history' },
      { status: 500 }
    );
  }
}
