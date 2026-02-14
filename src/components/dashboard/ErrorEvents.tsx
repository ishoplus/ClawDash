'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/lib/toast';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source?: string;
}

export function ErrorEvents() {
  const { showToast } = useToast();
  const [events, setEvents] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);
  const [level, setLevel] = useState('error');

  useEffect(() => {
    fetchData();
  }, [hours, level]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/analytics/errors?hours=${hours}&level=${level}`);
      const result = await response.json();
      setEvents(result.events || []);
    } catch (error) {
      console.error('Error fetching error logs:', error);
      showToast('載入日誌失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          ⚠️ 異常事件
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={hours}
            onChange={(e) => setHours(parseInt(e.target.value))}
            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
          >
            <option value={6}>6 小時</option>
            <option value={24}>24 小時</option>
            <option value={72}>3 天</option>
            <option value={168}>7 天</option>
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
          >
            <option value="error">錯誤</option>
            <option value="warning">警告+錯誤</option>
            <option value="all">全部</option>
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-50"
          >
            🔄
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : events.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          ✅ 沒有異常事件
        </p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {events.map((event, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${
                event.level === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    event.level === 'error'
                      ? 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300'
                      : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {event.level === 'error' ? '❌ 錯誤' : '⚠️ 警告'}
                  </span>
                  {event.source && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {event.source}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(event.timestamp).toLocaleString('zh-TW')}
                </span>
              </div>
              <pre className="mt-2 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all font-mono">
                {event.message}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
