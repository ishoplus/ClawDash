'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/lib/toast';

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

interface Message {
  role: string;
  content: string;
  timestamp?: string;
  tokens?: {
    input?: number;
    output?: number;
  };
}

export function SessionHistory() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // Fetch all agents' sessions by not specifying agent
      const response = await fetch('/api/dashboard/history');
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showToast('載入會話歷史失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionMessages = async (sessionKey: string) => {
    setMessagesLoading(true);
    setSelectedSession(sessionKey);
    try {
      const response = await fetch(`/api/dashboard/history?agent=code&key=${encodeURIComponent(sessionKey)}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      showToast('載入訊息失敗', 'error');
    } finally {
      setMessagesLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          📜 會話歷史
        </h2>
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
        >
          🔄 刷新
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          沒有會話歷史
        </p>
      ) : selectedSession ? (
        /* Message View */
        <div>
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={() => setSelectedSession(null)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              ← 返回列表
            </button>
            <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
              {selectedSession}
            </span>
          </div>

          {messagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              無訊息內容
            </p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 ml-8'
                      : 'bg-gray-50 dark:bg-gray-700/50 mr-8'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${
                      msg.role === 'user' 
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {msg.role === 'user' ? '👤 用戶' : '🤖 Agent'}
                    </span>
                    {msg.tokens && (
                      <span className="text-xs text-gray-400">
                        {msg.tokens.input || 0} / {msg.tokens.output || 0} tokens
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Session List */
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.key}
              onClick={() => fetchSessionMessages(session.key)}
              className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                  {session.key}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {session.updatedAt}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>{session.channel}</span>
                <span>{session.messageCount} 則訊息</span>
                <span>{(session.inputTokens + session.outputTokens).toLocaleString()} tokens</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
