'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/lib/toast';

interface WorkloadStats {
  totalSessions: number;
  totalMessages: number;
  totalTokens: number;
  avgSessionLength: number;
  topChannels: Record<string, number>;
  hourlyDistribution: number[];
  lastActivity: string;
}

export function WorkloadStats() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<WorkloadStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard/analytics/workload?agent=code');
      const result = await response.json();
      setStats(result.stats);
    } catch (error) {
      console.error('Error fetching workload stats:', error);
      showToast('載入數據失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const maxHourly = stats ? Math.max(...stats.hourlyDistribution, 1) : 1;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          📊 工作負載統計
        </h2>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-50"
        >
          🔄
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : !stats ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          沒有數據
        </p>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalSessions}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">總會話數</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalMessages.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">總訊息數</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalTokens.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">總 Tokens</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.avgSessionLength.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">平均會話長度</div>
            </div>
          </div>

          {/* Hourly Distribution */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              📅 24小時分佈
            </h3>
            <div className="flex items-end gap-1 h-24">
              {stats.hourlyDistribution.map((count, hour) => (
                <div
                  key={hour}
                  className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group"
                  style={{ height: `${(count / maxHourly) * 100}%` }}
                  title={`${hour}:00 - ${count} 訊息`}
                >
                  {count > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100">
                      {count}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </div>

          {/* Last Activity */}
          {stats.lastActivity && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              最後活動: {new Date(stats.lastActivity).toLocaleString('zh-TW')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
