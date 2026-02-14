'use client';

import { useEffect, useState, use } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { AgentSelector } from '@/components/agents/AgentSelector';

interface Conversation {
  key: string;
  sessionId: string;
  updatedAt: string;
  channel: string;
  lastTo: string;
  messageCount: number;
  inputTokens: number;
  outputTokens: number;
}

export default function AgentHistoryPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`/api/dashboard/history?agent=${agentId}`);
        if (res.ok) {
          const data = await res.json();
          setConversations(data.sessions || []);
        }
      } catch (e) {
        console.error('Failed to fetch history:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [agentId]);

  const filteredConversations = conversations.filter(c =>
    c.key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 頁面標題與 Agent 選擇器 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              📊 {agentId} 對話紀錄
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              過往的對話歷史
            </p>
          </div>
          <AgentSelector variant="dropdown" />
        </div>

        {/* 搜尋欄 */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋對話..."
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 對話列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
                  <span className="text-4xl mb-4">📊</span>
                  <p>尚無對話紀錄</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <a
                    key={conv.key}
                    href={`/agents/${agentId}/chat`}
                    className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xl">
                        💬
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {conv.key.split(':').pop() || '會話'}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {conv.updatedAt}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                          {conv.channel} • {conv.lastTo}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            💬 {conv.messageCount} 則訊息
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
