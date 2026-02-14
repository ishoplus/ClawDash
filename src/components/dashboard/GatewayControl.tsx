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
  const [pendingAction, setPendingAction] = useState<string | null>(null); // 確認對話框狀態

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard/gateway?action=status');
      const data = await response.json();
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

  // 顯示確認對話框
  const confirmAction = (action: string) => {
    setPendingAction(action);
  };

  // 執行確認的動作
  const executeAction = async () => {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    setActionLoading(action);

    try {
      const response = await fetch(`/api/dashboard/gateway?action=${action}`, { method: 'POST' });
      if (response.ok) {
        const messages: Record<string, string> = {
          restart: '運行服務已重啟',
          start: '運行服務已啟動',
          stop: '運行服務已停止'
        };
        showToast(messages[action], action === 'stop' ? 'warning' : 'success');
        setTimeout(fetchStatus, 2000);
      } else {
        showToast('操作失敗', 'error');
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
      {/* 確認對話框 */}
      {pendingAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {{
                restart: '🔄 確認重啟',
                start: '▶️ 確認啟動',
                stop: '⏹️ 確認停止'
              }[pendingAction as string]}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {{
                restart: '重啟運行服務可能會中斷正在進行的對話。確定要重啟嗎？',
                start: '確定要啟動運行服務嗎？',
                stop: '停止運行服務後，所有 AI 功能將暫時無法使用。確定要停止嗎？'
              }[pendingAction as string]}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingAction(null)}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={executeAction}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          🦞 運行服務
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
          {/* 狀態指示器 */}
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${status?.running ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
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

          {/* 控制按鈕 */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => confirmAction('restart')}
              disabled={actionLoading !== null}
              className="px-4 py-2 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'restart' ? '...' : '🔄 重啟'}
            </button>
            {!status?.running && (
              <button
                onClick={() => confirmAction('start')}
                disabled={actionLoading !== null}
                className="px-4 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'start' ? '...' : '▶️ 啟動'}
              </button>
            )}
            {status?.running && (
              <button
                onClick={() => confirmAction('stop')}
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
