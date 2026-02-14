'use client';

import { useState, useEffect, useRef } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { useToast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n-context';

interface SessionInfo {
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
  timestamp?: number;
  tokens?: {
    input?: number;
    output?: number;
  };
  pending?: boolean;
}

export default function ChatPage() {
  const { showToast } = useToast();
  const { t, locale } = useI18n();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestTimestampRef = useRef<number>(0);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard/history');
      const data = await response.json();
      setSessions(data.sessions || []);
      
      if (data.sessions?.length > 0 && !selectedSession) {
        setSelectedSession(data.sessions[0].key);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showToast(t('error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (sessionKey: string) => {
    setMessagesLoading(true);
    setSelectedSession(sessionKey);
    try {
      const response = await fetch(`/api/dashboard/history?key=${encodeURIComponent(sessionKey)}`);
      const data = await response.json();
      const newMessages = data.messages || [];
      setMessages(newMessages);
      
      if (newMessages.length > 0) {
        latestTimestampRef.current = Math.max(...newMessages.map((m: Message) => m.timestamp || 0));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      showToast(t('error'), 'error');
    } finally {
      setMessagesLoading(false);
    }
  };

  // Auto-refresh when session is selected
  useEffect(() => {
    if (!selectedSession) return;

    fetchMessages(selectedSession);
    
    const interval = setInterval(() => {
      if (!selectedSession) return;
      
      fetch(`/api/dashboard/history?key=${encodeURIComponent(selectedSession)}`)
        .then(res => res.json())
        .then(data => {
          const newMessages = data.messages || [];
          
          if (newMessages.length > 0) {
            const newLatest = Math.max(...newMessages.map((m: Message) => m.timestamp || 0));
            if (newLatest > latestTimestampRef.current) {
              const trulyNewMessages = newMessages.filter((m: Message) => 
                m.timestamp && m.timestamp > latestTimestampRef.current
              );
              
              if (trulyNewMessages.length > 0) {
                setMessages(prev => [...prev, ...trulyNewMessages]);
                latestTimestampRef.current = newLatest;
              }
            }
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedSession]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedSession) return;

    const text = messageText;
    const pendingMsg: Message = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
      pending: true
    };

    setMessages(prev => [...prev, pendingMsg]);
    setMessageText('');
    setSending(true);

    try {
      const response = await fetch('/api/dashboard/sessions/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionKey: selectedSession, message: text })
      });
      
      if (response.ok) {
        showToast(t('sent') + '，' + t('waiting'), 'success');
        setMessages(prev => prev.map(m => m === pendingMsg ? { ...m, pending: false } : m));
      } else {
        setMessages(prev => prev.filter(m => m !== pendingMsg));
        const error = await response.json();
        showToast(`${t('error')}: ${error.error}`, 'error');
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m !== pendingMsg));
      console.error('Error sending message:', error);
      showToast(t('error'), 'error');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const isToday = date.toDateString() === new Date().toDateString();
    
    const localeStr = locale === 'zh-TW' ? 'zh-TW' : 'en-US';
    const timeFormat: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    const dateFormat: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    
    if (isToday) {
      return date.toLocaleTimeString(localeStr, timeFormat);
    }
    return date.toLocaleDateString(localeStr, dateFormat) + ' ' + 
           date.toLocaleTimeString(localeStr, timeFormat);
  };

  const sessionsByAgent = sessions.reduce((acc, session) => {
    const agent = session.key.split(':')[1] || 'unknown';
    if (!acc[agent]) acc[agent] = [];
    acc[agent].push(session);
    return acc;
  }, {} as Record<string, SessionInfo[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          💬 {t('conversation')}
        </h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="flex gap-4 h-[calc(100vh-200px)]">
            <div className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-bold text-gray-900 dark:text-white">{t('activeSessions')}</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {Object.entries(sessionsByAgent).map(([agent, agentSessions]) => (
                  <div key={agent}>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      {agent}
                    </div>
                    {agentSessions.map((session) => (
                      <button
                        key={session.key}
                        onClick={() => fetchMessages(session.key)}
                        className={`w-full text-left px-3 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedSession === session.key ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {session.key.split(':').slice(2).join(':') || 'main'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {session.channel} • {session.updatedAt}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col overflow-hidden">
              {selectedSession ? (
                <>
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-gray-900 dark:text-white">
                        {selectedSession.split(':').slice(1).join(':')}
                      </h2>
                    </div>
                    <button
                      onClick={() => fetchMessages(selectedSession)}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                      title={t('refresh')}
                    >
                      🔄
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        {t('noMessages')}
                      </div>
                    ) : (
                      messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              msg.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : msg.role === 'assistant'
                                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                  : 'bg-orange-50 dark:bg-orange-900/20 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="text-xs font-medium mb-1 opacity-70 flex items-center gap-1">
                              {msg.role === 'user' ? '👤 ' + t('user') : msg.role === 'assistant' ? '🤖 Agent' : '🔧 ' + t('system')}
                              {msg.pending && <span className="text-blue-500 animate-pulse">{t('waiting')}</span>}
                            </div>
                            <div className="text-sm whitespace-pre-wrap break-all">
                              {msg.pending ? (
                                <span className="italic opacity-70">{msg.content}</span>
                              ) : (
                                msg.content
                              )}
                            </div>
                            {msg.timestamp && !msg.pending && (
                              <div className="text-xs opacity-50 mt-1 text-right">
                                {formatTime(msg.timestamp)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder={t('sendMessage')}
                        className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={sending || !messageText.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                      >
                        {sending ? '...' : t('sending')}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  {t('selectSession')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
