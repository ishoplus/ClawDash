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

interface CronJobSummary {
  enabled: boolean;
  name?: string;
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
      {/* 簡易模式 - 重新設計 */}
      {!showAdvanced && (
        <>
          {/* 頂部：Agent 選擇區域 */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm opacity-75">AI 助手</p>
                  <h1 className="text-2xl font-bold">
                    {currentAgent?.displayName || 'Code'} 
                    <span className="ml-2 text-sm opacity-75">
                      ({availableAgents.length} 個)
                    </span>
                  </h1>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  data?.agent ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {data?.agent ? '✅ 運行中' : '⚠️ 需要設定'}
                </div>
              </div>
              <button
                onClick={() => setShowAdvanced(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                🔧 進階模式
              </button>
            </div>

            {/* Agent 選擇器 */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {availableAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleAgentChange(agent.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    selectedAgent === agent.id
                      ? 'bg-white text-slate-800'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {agent.displayName}
                </button>
              ))}
            </div>
          </div>

          {/* 狀態小卡片網格 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Agent 卡片 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">🤖</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Agent</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {data?.agent?.model || '未設定'}
              </p>
            </div>

            {/* 會話卡片 */}
            <Link href="/sessions" className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">💬</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">對話中</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                {data?.activeSessions.length} 個會話
              </p>
            </Link>

            {/* Token 卡片 */}
            <Link href="/analytics" className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-300 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">📊</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Token</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                {data?.agent?.tokenUsage.total.toLocaleString() || 0}
              </p>
            </Link>

            {/* 檔案卡片 */}
            <Link href="/files" className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-orange-300 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">📁</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">工作檔案</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                {data?.workspace.length} 個
              </p>
            </Link>

            {/* Cron 卡片 */}
            <Link href="/cron" className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-purple-300 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">⏰</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">排程任務</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                {data?.cronJobs.filter((j: CronJobSummary) => j.enabled).length} / {data?.cronJobs.length} 運行
              </p>
            </Link>

            {/* Gateway 卡片 */}
            <Link href="/logs" className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-red-300 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">🦞</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Gateway</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                ✅ 運行中
              </p>
            </Link>

            {/* 頻道卡片 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">📡</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">頻道</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {data?.agent?.channel || '-'}
              </p>
            </div>

            {/* Context 卡片 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">📝</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Context</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                {data?.agent?.context || '-'}
              </p>
            </div>
          </div>

          {/* 快捷操作區域 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/chat" className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl p-4 transition-colors border border-blue-100 dark:border-blue-800">
              <span className="text-2xl">💬</span>
              <span className="font-medium text-blue-700 dark:text-blue-300">新對話</span>
            </Link>
            <Link href="/history" className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl p-4 transition-colors border border-green-100 dark:border-green-800">
              <span className="text-2xl">📊</span>
              <span className="font-medium text-green-700 dark:text-green-300">對話紀錄</span>
            </Link>
            <Link href="/config" className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl p-4 transition-colors border border-purple-100 dark:border-purple-800">
              <span className="text-2xl">⚙️</span>
              <span className="font-medium text-purple-700 dark:text-purple-300">功能設定</span>
            </Link>
            <Link href="/settings" className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl p-4 transition-colors border border-gray-200 dark:border-gray-700">
              <span className="text-2xl">🎨</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">應用設定</span>
            </Link>
          </div>
        </>
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
