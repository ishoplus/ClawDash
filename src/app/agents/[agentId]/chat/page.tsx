'use client';

import { useEffect, useState, use } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { AgentSelector } from '@/components/agents/AgentSelector';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export default function AgentChatPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);

  // 連接 WebSocket
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:18789/ws/${agentId}`);
    
    ws.onopen = () => {
      setConnected(true);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: data.content,
            timestamp: new Date().toISOString()
          }]);
        }
      } catch (e) {
        console.error('WS message parse error:', e);
      }
    };
    
    ws.onclose = () => setConnected(false);
    
    return () => ws.close();
  }, [agentId]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);
    
    // 模擬發送（實際會透過 WebSocket）
    setTimeout(() => {
      setSending(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `收到訊息：${input}`,
        timestamp: new Date().toISOString()
      }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 頁面標題與 Agent 選擇器 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              💬 與 {agentId} 對話
            </h1>
            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {connected ? '已連線' : '未連線'}
            </p>
          </div>
          <AgentSelector variant="dropdown" />
        </div>

        {/* 對話區域 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          {/* 訊息列表 */}
          <div className="h-[60vh] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <span className="text-4xl mb-4">💬</span>
                <p>開始與 AI 助手對話吧！</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('zh-TW')}
                    </p>
                  </div>
                </div>
              ))
            )}
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
  );
}
