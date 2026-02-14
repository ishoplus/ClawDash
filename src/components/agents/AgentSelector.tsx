'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  displayName: string;
}

interface AgentSelectorProps {
  variant?: 'dropdown' | 'cards' | 'minimal';
  showAllOption?: boolean;
  onSelect?: (agentId: string) => void;
}

export function AgentSelector({ variant = 'dropdown', showAllOption = false, onSelect }: AgentSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // 從路徑提取當前 agent
  useEffect(() => {
    const match = pathname.match(/^\/agents\/([^\/]+)/);
    if (match) {
      setSelectedAgent(match[1]);
    }
  }, [pathname]);

  // 取得 agent 清單
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/dashboard/agents');
        const data = await res.json();
        setAgents(data);
        if (!selectedAgent && data.length > 0) {
          setSelectedAgent(data[0].id);
        }
      } catch (e) {
        console.error('Failed to fetch agents:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  // 選擇 agent
  const handleSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    onSelect?.(agentId);
    
    if (agentId === 'all') {
      router.push('/');
    } else {
      router.push(`/agents/${agentId}/chat`);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 rounded-lg"></div>
    );
  }

  // 下拉式選擇器
  if (variant === 'dropdown') {
    return (
      <select
        value={selectedAgent}
        onChange={(e) => handleSelect(e.target.value)}
        className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {showAllOption && (
          <option value="all">🌐 所有 Agent</option>
        )}
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            🤖 {agent.displayName}
          </option>
        ))}
      </select>
    );
  }

  // 卡片式選擇器
  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {showAllOption && (
          <button
            onClick={() => handleSelect('all')}
            className={`p-4 rounded-xl border-2 transition-colors ${
              selectedAgent === 'all'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">🌐</span>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">所有 Agent</p>
          </button>
        )}
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => handleSelect(agent.id)}
            className={`p-4 rounded-xl border-2 transition-colors text-left ${
              selectedAgent === agent.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">🤖</span>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {agent.displayName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {agent.role}
            </p>
          </button>
        ))}
      </div>
    );
  }

  // 極簡式（只用於頂部導航）
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">Agent:</span>
      <select
        value={selectedAgent}
        onChange={(e) => handleSelect(e.target.value)}
        className="px-3 py-1 bg-transparent border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white"
      >
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>
    </div>
  );
}
