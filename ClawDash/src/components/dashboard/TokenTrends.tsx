'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/lib/toast';

interface TokenDataPoint {
  date: string;
  input: number;
  output: number;
  total: number;
  sessions: number;
}

export function TokenTrends() {
  const { showToast } = useToast();
  const [data, setData] = useState<TokenDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/analytics/tokens?agent=code&period=${period}`);
      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error('Error fetching token data:', error);
      showToast('載入數據失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalInput = data.reduce((sum, d) => sum + d.input, 0);
  const totalOutput = data.reduce((sum, d) => sum + d.output, 0);
  const total = totalInput + totalOutput;
  const avgDaily = data.length > 0 ? Math.round(total / data.length) : 0;

  // Simple bar chart calculation
  const maxTotal = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          📈 Token 趨勢
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
          >
            <option value="7d">7 天</option>
            <option value="30d">30 天</option>
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
      ) : data.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          沒有數據
        </p>
      ) : (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalInput.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">輸入</div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {totalOutput.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">輸出</div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {total.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">總計</div>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {avgDaily.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">日均</div>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">每日消耗</div>
            {data.slice(-14).map((day) => (
              <div key={day.date} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-20">
                  {day.date.slice(5)}
                </span>
                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${(day.input / maxTotal) * 100}%` }}
                    title={`輸入: ${day.input.toLocaleString()}`}
                  />
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(day.output / maxTotal) * 100}%` }}
                    title={`輸出: ${day.output.toLocaleString()}`}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 w-16 text-right">
                  {day.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>輸入</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>輸出</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
