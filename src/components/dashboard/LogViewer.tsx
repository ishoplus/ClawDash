'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/lib/toast';

export function LogViewer() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState(50);
  const [filter, setFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(10); // seconds
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchLogs, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = `/api/dashboard/logs?lines=${lines}${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      showToast('載入日誌失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          📋 Gateway 日誌
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={lines}
            onChange={(e) => setLines(parseInt(e.target.value))}
            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
          >
            <option value={20}>20 行</option>
            <option value={50}>50 行</option>
            <option value={100}>100 行</option>
            <option value={200}>200 行</option>
          </select>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="過濾關鍵字..."
            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded w-32"
          />
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            🔄
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="自動刷新"
          >
            {autoRefresh ? '⏸️' : '▶️'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : logs.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          沒有日誌內容
        </p>
      ) : (
        <div className="bg-gray-900 dark:bg-black rounded-lg p-4 max-h-[400px] overflow-y-auto font-mono text-xs">
          {logs.map((log, idx) => (
            <div key={idx} className="text-gray-300 whitespace-pre-wrap break-all">
              {log}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
}
