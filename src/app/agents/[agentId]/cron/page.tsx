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
  lastRun?: string;
  nextRun?: string;
}

export default function AgentCronPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCronJobs() {
      try {
        const res = await fetch(`/api/dashboard/cron?agent=${agentId}`);
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs || []);
        }
      } catch (e) {
        console.error('Failed to fetch cron jobs:', e);
        // 模擬資料
        setJobs([
          { id: '1', name: '每日備份', schedule: '0 2 * * *', command: 'backup.sh', enabled: true },
          { id: '2', name: '清理日誌', schedule: '0 3 * * 0', command: 'cleanup.sh', enabled: false },
          { id: '3', name: '健康檢查', schedule: '*/5 * * * *', command: 'healthcheck.sh', enabled: true },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchCronJobs();
  }, [agentId]);

  const toggleJob = (jobId: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, enabled: !job.enabled } : job
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 頁面標題與 Agent 選擇器 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              ⏰ {agentId} 排程任務
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              自動執行的任務列表
            </p>
          </div>
          <AgentSelector variant="dropdown" />
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
              {jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
                  <span className="text-4xl mb-4">⏰</span>
                  <p>尚無排程任務</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* 開關 */}
                        <button
                          onClick={() => toggleJob(job.id)}
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
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {job.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {job.schedule}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {job.command}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {job.enabled && (
                          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                            下次執行: {job.nextRun || '未知'}
                          </span>
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
      </div>
    </div>
  );
}
