'use client';

import { useEffect, useState, use } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { AgentSelector } from '@/components/agents/AgentSelector';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  command: string;
  enabled: boolean;
  sessionTarget?: string;
  nextRun?: string;
  lastRun?: string;
  description?: string;
}

export default function AgentCronPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  useEffect(() => {
    async function fetchCronJobs() {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/cron?agent=${agentId}`);
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs || []);
        }
      } catch (e) {
        console.error('Failed to fetch cron jobs:', e);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCronJobs();
  }, [agentId]);

  const toggleJob = async (jobId: string, currentEnabled: boolean) => {
    try {
      const res = await fetch(`/api/dashboard/cron?id=${jobId}&action=${currentEnabled ? 'disable' : 'enable'}`, {
        method: 'PATCH'
      });
      if (res.ok) {
        setJobs(jobs.map(job => 
          job.id === jobId ? { ...job, enabled: !currentEnabled } : job
        ));
      }
    } catch (e) {
      console.error('Failed to toggle job:', e);
    }
  };

  // 過濾任務
  const filteredJobs = jobs.filter(job => {
    if (filter === 'enabled') return job.enabled;
    if (filter === 'disabled') return !job.enabled;
    return true;
  });

  // 取得任務圖標
  const getTargetIcon = (target?: string) => {
    if (!target || target === 'isolated') return '🔧';
    if (target === 'code') return '💻';
    if (target === 'rich') return '🎨';
    return '🤖';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 頁面標題與 Agent 選擇器 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              ⏰ 排程任務
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              全局排程任務（適用於所有 Agent）
            </p>
          </div>
          <AgentSelector variant="dropdown" />
        </div>

        {/* 過濾器 */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'all', label: '全部', count: jobs.length },
            { key: 'enabled', label: '已啟用', count: jobs.filter(j => j.enabled).length },
            { key: 'disabled', label: '已停用', count: jobs.filter(j => !j.enabled).length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* 新增排程按鈕 */}
        <div className="mb-4 flex justify-end">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
            <span>+</span> 新增排程
          </button>
        </div>

        {/* 排程列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
                  <span className="text-4xl mb-4">⏰</span>
                  <p>尚無排程任務</p>
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <div key={job.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* 開關 */}
                        <button
                          onClick={() => toggleJob(job.id, job.enabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            job.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              job.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {job.name}
                            </h3>
                            <span className="text-lg" title={`目標: ${job.sessionTarget || '全局'}`}>
                              {getTargetIcon(job.sessionTarget)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {job.schedule}
                          </p>
                          {job.description && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {job.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {job.nextRun && (
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-400">下次執行</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {job.nextRun}
                            </p>
                          </div>
                        )}
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          ✏️
                        </button>
                        <button className="text-gray-400 hover:text-red-600">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 說明 */}
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 排程任務是全局的，透過 <code>sessionTarget</code> 指定運行目標。
            例如：<code>💻 code</code> 表示任務將在 Code Agent 執行。
          </p>
        </div>
      </div>
    </div>
  );
}
