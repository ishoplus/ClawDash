'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/lib/toast';

interface GatewayStatus {
  running?: boolean;
  port?: number;
  version?: string;
  uptime?: string;
  sessions?: number;
  [key: string]: unknown;
}

export function GatewayControl() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard/gateway?action=status');
      const data = await response.json();
      
      // Parse the raw output to extract status
      const raw = data.raw || '';
      const isRunning = raw.includes('Running') || raw.includes('running');
      const portMatch = raw.match(/port[=:]?\s*(\d+)/i);
      const versionMatch = raw.match(/version[=:]?\s*([\d.]+)/i);
      
      setStatus({
        running: isRunning,
        port: portMatch ? parseInt(portMatch[1]) : 19000,
        version: versionMatch ? versionMatch[1] : 'unknown',
        raw: raw
      });
    } catch (error) {
      console.error('Error fetching gateway status:', error);
      setStatus({ running: false });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!confirm(`確定要 ${action === 'restart' ? '重啟' : action === 'start' ? '啟動' : '停止'} Gateway 嗎？`)) {
      return;
    }

    setActionLoading(action);
    try {
      const response = await fetch(`/api/dashboard/gateway?action=${action}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        showToast(`Gateway 已${action === 'restart' ? '重啟' : action === 'start' ? '啟動' : '停止'}`, 'success');
        // Wait a bit then refresh status
        setTimeout(fetchStatus, 2000);
      } else {
        showToast(`操作失敗`, 'error');
      }
    } catch (error) {
      console.error('Error with gateway action:', error);
      showToast('操作失敗', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          🦞 Gateway 狀態
        </h2>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
        >
          🔄 刷新
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${status?.running ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-medium text-gray-900 dark:text-white">
              {status?.running ? '運行中' : '已停止'}
            </span>
            {status?.port && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Port: {status.port}
              </span>
            )}
            {status?.version && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                v{status.version}
              </span>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => handleAction('restart')}
              disabled={actionLoading !== null}
              className="px-4 py-2 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'restart' ? '...' : '🔄 重啟'}
            </button>
            {!status?.running && (
              <button
                onClick={() => handleAction('start')}
                disabled={actionLoading !== null}
                className="px-4 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'start' ? '...' : '▶️ 啟動'}
              </button>
            )}
            {status?.running && (
              <button
                onClick={() => handleAction('stop')}
                disabled={actionLoading !== null}
                className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'stop' ? '...' : '⏹️ 停止'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
