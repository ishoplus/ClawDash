'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh when agent changes

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
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
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

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Fetch data when agent changes
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [selectedAgent, fetchData]);

  // Refresh interval - use settings or default to 30s
  useEffect(() => {
    const intervalMs = (settings.refreshInterval || 30) * 1000;
    if (intervalMs === 0) return; // Disabled
    
    const interval = setInterval(() => {
      fetchData();
    }, intervalMs);
    return () => clearInterval(interval);
  }, [fetchData, settings.refreshInterval]);

  const handleAgentChange = (newAgent: string) => {
    if (newAgent !== selectedAgent) {
      setSelectedAgent(newAgent);
      setRefreshKey(prev => prev + 1); // Force refresh
    }
  };

  // Show loading only on first load
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

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Header with Agent Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 OpenClaw Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            实时监控 Agent 状态、工作目录和任务排程
          </p>
        </div>

        {/* Agent Selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Agent:
          </label>
          <select
            value={selectedAgent}
            onChange={(e) => handleAgentChange(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading indicator for agent switch */}
      {loading && data && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-blue-700 dark:text-blue-300 text-sm">
          🔄 正在切换到 {availableAgents.find(a => a.id === selectedAgent)?.displayName}...
        </div>
      )}

      {/* Alerts Banner */}
      <AlertsBanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Agent Status */}
        <div className="lg:col-span-1">
          <AgentStatus agent={data.agent} />
        </div>

        {/* Right column - Active Sessions */}
        <div className="lg:col-span-2">
          <ActiveSessions sessions={data.activeSessions} onRefresh={fetchData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workspace File Explorer */}
        <WorkspaceFileExplorer 
          files={data.workspace} 
          agentId={selectedAgent}
          key={`workspace-${selectedAgent}`}
        />

        {/* Cron Jobs */}
        <CronJobs jobs={data.cronJobs} currentAgent={selectedAgent} />
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        自动刷新：{settings.refreshInterval === 0 ? '已关闭' : `${settings.refreshInterval}秒`} | 最后更新：{new Date().toLocaleString('zh-TW')}
      </div>

      {/* Gateway Control */}
      <div className="mt-6">
        <GatewayControl />
      </div>
    </div>
  );
}
