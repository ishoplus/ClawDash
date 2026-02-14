'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AgentStatus } from './AgentStatus';
import { WorkspaceFileExplorer } from './WorkspaceFileExplorer';
import { ActiveSessions } from './ActiveSessions';
import { CronJobs } from './CronJobs';
import { GatewayControl } from './GatewayControl';
import { AlertsBanner } from './AlertsBanner';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast';
import type { DashboardData } from '../../lib/types';

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  displayName: string;
}

export function Dashboard() {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('code');
  const [availableAgents, setAvailableAgents] = useState<AgentInfo[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false); // 簡易/進階模式

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/agents');
      if (response.ok) {
        const agents = await response.json();
        setAvailableAgents(agents);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard?agent=${selectedAgent}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      showToast(`載入失敗: ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedAgent, showToast]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [selectedAgent, fetchData]);

  useEffect(() => {
    const intervalMs = (settings.refreshInterval || 30) * 1000;
    if (intervalMs === 0) return;
    const interval = setInterval(() => fetchData(), intervalMs);
    return () => clearInterval(interval);
  }, [fetchData, settings.refreshInterval]);

  const handleAgentChange = (newAgent: string) => {
    if (newAgent !== selectedAgent) {
      setSelectedAgent(newAgent);
      setRefreshKey(prev => prev + 1);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-red-700 dark:text-red-300">
        <p className="font-medium">Error loading dashboard:</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const currentAgent = availableAgents.find(a => a.id === selectedAgent);

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* 簡易模式 - 歡迎區域 */}
      {!showAdvanced && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                👋 嗨，歡迎使用 AI 助手
              </h1>
              <p className="opacity-90">
                你的 AI 助手「{currentAgent?.displayName || 'Code'}」目前 {data?.agent ? '✅ 正常運行' : '⚠️ 需要設定'}
              </p>
            </div>
            <button
              onClick={() => setShowAdvanced(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
            >
              🔧 進階設定
            </button>
          </div>

          {/* 三大功能入口 */}
          <div className="grid grid-cols-3 gap-4">
            <Link href="/chat" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-colors group cursor-pointer">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">💬</div>
              <h3 className="font-medium mb-1">與 AI 對話</h3>
              <p className="text-sm opacity-75">發送訊息給你的 AI 助手</p>
            </Link>
            <Link href="/history" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-colors group cursor-pointer">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📊</div>
              <h3 className="font-medium mb-1">對話紀錄</h3>
              <p className="text-sm opacity-75">查看過去的對話內容</p>
            </Link>
            <Link href="/config" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-colors group cursor-pointer">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">⚙️</div>
              <h3 className="font-medium mb-1">功能設定</h3>
              <p className="text-sm opacity-75">調整 AI 助手的功能</p>
            </Link>
          </div>
        </div>
      )}

      {/* 簡易模式 - 狀態卡片 */}
      {!showAdvanced && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI 模型</p>
                <p className="font-medium text-gray-900 dark:text-white">{data?.agent.model || '未設定'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">對話中</p>
                <p className="font-medium text-gray-900 dark:text-white">{data?.activeSessions.length} 個</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📁</span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">工作檔案</p>
                <p className="font-medium text-gray-900 dark:text-white">{data?.workspace.length} 個</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">排程任務</p>
                <p className="font-medium text-gray-900 dark:text-white">{data?.cronJobs.filter((j: any) => j.enabled).length} 個運行</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 進階模式 - 返回按鈕 */}
      {showAdvanced && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAdvanced(false)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← 返回簡易模式
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">進階監控面板</span>
        </div>
      )}

      {/* 進階模式 - 完整監控面板 */}
      {showAdvanced && (
        <>
          {/* Agent Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 rounded-xl p-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                📊 監控面板
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                實時監控 AI 助手狀態與任務
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                AI 助手：
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
              >
                {availableAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Alerts Banner */}
          <AlertsBanner />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <AgentStatus agent={data?.agent} />
            </div>
            <div className="lg:col-span-2">
              <ActiveSessions sessions={data?.activeSessions} onRefresh={fetchData} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WorkspaceFileExplorer files={data?.workspace} agentId={selectedAgent} />
            <CronJobs jobs={data?.cronJobs} currentAgent={selectedAgent} />
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            自動刷新：{settings.refreshInterval === 0 ? '已關閉' : `${settings.refreshInterval}秒`} | 
            最後更新：{new Date().toLocaleString('zh-TW')}
          </div>

          <GatewayControl />
        </>
      )}
    </div>
  );
}
