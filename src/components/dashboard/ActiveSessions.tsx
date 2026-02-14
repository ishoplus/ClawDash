'use client';

import { useState } from 'react';
import { useToast } from '@/lib/toast';

interface SessionInfo {
  key: string;
  kind: string;
  agentId: string;
  channel: string;
  displayName: string;
  updatedAt: string;
  model: string;
  contextTokens: number;
  totalTokens: number;
}

interface ActiveSessionsProps {
  sessions: SessionInfo[];
  onRefresh?: () => void;
}

export function ActiveSessions({ sessions, onRefresh }: ActiveSessionsProps) {
  const { showToast } = useToast();
  const [terminating, setTerminating] = useState<string | null>(null);
  const [messaging, setMessaging] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async (sessionKey: string) => {
    if (!messageText.trim()) {
      showToast('請輸入訊息', 'error');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/dashboard/sessions/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionKey, message: messageText })
      });
      
      if (response.ok) {
        showToast('訊息已發送，等待回覆...', 'success');
        setMessageText('');
        setMessaging(null);
        setTimeout(() => {
          onRefresh?.();
        }, 3000);
      } else {
        const error = await response.json();
        showToast(`發送失敗: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('發送失敗', 'error');
    } finally {
      setSending(false);
    }
  };

  const terminateSession = async (sessionKey: string) => {
    if (!confirm('確定要終止這個會話嗎？')) return;

    setTerminating(sessionKey);
    try {
      const response = await fetch(
        `/api/dashboard/sessions?key=${encodeURIComponent(sessionKey)}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        showToast('會話已終止', 'success');
        window.location.reload();
      } else {
        const error = await response.json();
        showToast(`終止失敗: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Error terminating session:', error);
      showToast('終止失敗', 'error');
    } finally {
      setTerminating(null);
    }
  };

  const renderSessionCard = (session: SessionInfo, isCron: boolean) => (
    <div
      key={session.key}
      className={`border rounded-lg p-4 transition-colors ${
        isCron
          ? 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10'
          : session.agentId === 'code'
            ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCron && <span className="text-xs">⏰</span>}
          <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
            {session.key}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isCron && (
            <button
              onClick={() => setMessaging(messaging === session.key ? null : session.key)}
              className="px-3 py-2 text-sm min-w-[60px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors touch-manipulation"
              title="发送消息"
            >
              ✉️ 發訊
            </button>
          )}
          <button
            onClick={() => terminateSession(session.key)}
            disabled={terminating === session.key}
            className="px-3 py-2 text-sm min-w-[60px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors touch-manipulation"
            title="终止会话"
          >
            {terminating === session.key ? '...' : '⏹️'}
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {session.updatedAt}
          </span>
        </div>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">{session.channel}</span>
          <span className={`font-medium ${
            session.displayName.includes('当前') 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-900 dark:text-white'
          }`}>
            {session.displayName}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">模型:</span>
          <span className="font-mono text-gray-900 dark:text-white">{session.model}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Tokens:</span>
          <span className="font-mono text-gray-900 dark:text-white">
            {session.contextTokens.toLocaleString()} / {session.totalTokens.toLocaleString()}
          </span>
        </div>
      </div>
      
      {!isCron && messaging === session.key && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(session.key)}
              placeholder="輸入訊息..."
              className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => sendMessage(session.key)}
              disabled={sending}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {sending ? '...' : '發送'}
            </button>
            <button
              onClick={() => setMessaging(null)}
              className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        💬 活躍會話
      </h2>
      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">沒有活躍的會話</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            從 Telegram 發送訊息給 Agent 即可開始新會話
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const isCron = session.key.includes(':cron:');
            return renderSessionCard(session, isCron);
          })}
        </div>
      )}
    </div>
  );
}
