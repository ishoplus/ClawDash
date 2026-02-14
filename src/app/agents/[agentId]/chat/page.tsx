'use client';

import { useEffect, useState, use, useRef } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { AgentSelector } from '@/components/agents/AgentSelector';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tokens?: { input?: number; output?: number };
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

export default function AgentChatPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 載入會話列表
  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch(`/api/dashboard/history?agent=${agentId}`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch (e) {
        console.error('Failed to fetch sessions:', e);
      }
    }
    fetchSessions();
  }, [agentId]);

  // 選擇會話
  const selectSession = async (key: string) => {
    setSessionKey(key);
    await fetchMessages(key);
  };

  // 載入會話訊息
  async function fetchMessages(key: string) {
    try {
      const res = await fetch(`/api/dashboard/history?key=${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages.map((m: any, idx: number) => ({
          id: m.timestamp?.toString() || idx.toString(),
          role: m.role || 'user',
          content: m.content || '[無內容]',
          timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
          tokens: m.tokens
        })));
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e);
      setMessages([]);
    }
  }

  // 連接 WebSocket - 使用更好的錯誤處理
  useEffect(() => {
    if (!sessionKey) return;

    // 關閉舊連接
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        // Ignore close errors
      }
    }

    const wsUrl = `ws://localhost:18789/ws/${agentId}`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    let ws: WebSocket;
    let connectionTimeout: NodeJS.Timeout;

    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // 連接超時 (5秒)
      connectionTimeout = setTimeout(() => {
        console.log('WebSocket connection timeout');
        ws.close();
        setConnected(false);
      }, 5000);

      ws.onopen = () => {
        console.log('WebSocket connected');
        clearTimeout(connectionTimeout);
        setConnected(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message') {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: data.content || '[回覆]',
              timestamp: new Date().toISOString()
            }]);
          }
        } catch (e) {
          console.error('WS message parse error:', e);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        clearTimeout(connectionTimeout);
        setConnected(false);
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        clearTimeout(connectionTimeout);
        setConnected(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      clearTimeout(connectionTimeout);
      setConnected(false);
    }
    
    return () => {
      clearTimeout(connectionTimeout);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [agentId, sessionKey]);

  // 滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 選擇第一個會話
  useEffect(() => {
    if (sessions.length > 0 && !sessionKey) {
      selectSession(sessions[0].key);
    }
  }, [sessions]);

  const sendMessage = async () => {
    if (!input.trim() || sending || !sessionKey) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };
    
    // 樂觀更新：先顯示使用者訊息
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);
    
    try {
      const response = await fetch('/api/dashboard/sessions/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionKey, message: input.trim() })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Send error:', error);
        // 發送失敗時移除訊息
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        alert(`發送失敗: ${error.error || '未知錯誤'}`);
      }
      // 如果成功，WebSocket 會收到回覆並更新訊息列表
    } catch (error) {
      console.error('Send error:', error);
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      alert('發送失敗，請稍後重試');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '--:--';
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      if (diff < 86400000) {
        return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
      } else if (diff < 172800000) {
        return '昨天';
      } else {
        return date.toLocaleDateString('zh-TW');
      }
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex gap-6 h-[calc(100vh-140px)]">
          {/* 左側會話列表 */}
          <div className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">對話紀錄</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  尚無對話
                </div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.key}
                    onClick={() => selectSession(session.key)}
                    className={`w-full text-left p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      sessionKey === session.key ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {session.key.split(':').pop() || 'main'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {session.messageCount} 則訊息
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 右側對話區域 */}
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            {/* 標題欄 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-gray-900 dark:text-white">
                  {agentId}
                </h2>
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {connected ? '已連線' : '未連線'}
                </span>
              </div>
              <AgentSelector variant="minimal" />
            </div>

            {/* 訊息列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <span className="text-4xl mb-4">💬</span>
                  <p>{sessionKey ? '此會話尚無訊息' : '選擇一個會話開始對話'}</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 輸入區域 */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="輸入訊息..."
                  disabled={sending}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-colors"
                >
                  {sending ? '...' : '發送'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
