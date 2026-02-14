'use client';

import { useState, useEffect } from 'react';

interface HealthCheck {
  openclaw: {
    installed: boolean;
    version: string | null;
    path: string | null;
  };
  gateway: {
    running: boolean;
    port: number | null;
    pid: number | null;
  };
  workspace: {
    exists: boolean;
    path: string | null;
    agents: string[];
  };
  node: {
    version: string | null;
  };
}

interface Props {
  onReady?: () => void;
}

export function EnvironmentCheck({ onReady }: Props) {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('checking');

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth(data.checks);
      setStatus(data.status);
      
      if (data.status === 'ready') {
        onReady?.();
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">檢查環境中...</span>
        </div>
      </div>
    );
  }

  const isReady = status === 'ready';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          🏥 環境檢查
        </h2>
        <button
          onClick={checkHealth}
          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          🔄 重新檢查
        </button>
      </div>

      {/* Overall Status */}
      <div className={`mb-6 p-4 rounded-lg ${
        isReady 
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{isReady ? '✅' : '❌'}</span>
          <div>
            <div className={`font-bold ${isReady ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {isReady ? '環境就緒' : '環境異常'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isReady ? '可以正常使用 Dashboard' : '請解決以下問題後再使用'}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Checks */}
      <div className="space-y-4">
        {/* OpenClaw */}
        <CheckItem
          label="OpenClaw CLI"
          status={health?.openclaw.installed ? 'pass' : 'fail'}
          details={health?.openclaw.installed 
            ? `Version: ${health.openclaw.version} | Path: ${health.openclaw.path}`
            : '未安裝'
          }
        />

        {/* Gateway */}
        <CheckItem
          label="Gateway 服務"
          status={health?.gateway.running ? 'pass' : 'fail'}
          details={health?.gateway.running 
            ? `Port: ${health.gateway.port} | PID: ${health.gateway.pid}`
            : '未運行，請執行 openclaw gateway start'
          }
        />

        {/* Workspace */}
        <CheckItem
          label="工作目錄"
          status={health?.workspace.exists ? 'pass' : 'fail'}
          details={health?.workspace.exists 
            ? `路徑: ${health.workspace.path} | Agents: ${health.workspace.agents.join(', ') || '無'}`
            : '工作目錄不存在'
          }
        />

        {/* Node.js */}
        <CheckItem
          label="Node.js"
          status={health?.node.version ? 'pass' : 'fail'}
          details={health?.node.version 
            ? `Version: ${health.node.version}`
            : '未找到'
          }
        />
      </div>

      {/* Installation Guide if not ready */}
      {!isReady && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            📝 安裝指南
          </h3>
          <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
{`# 1. 安裝 OpenClaw
brew install openclaw

# 2. 初始化
openclaw setup

# 3. 啟動 Gateway
openclaw gateway start

# 4. 驗證
openclaw gateway status`}
          </pre>
        </div>
      )}
    </div>
  );
}

function CheckItem({ label, status, details }: { 
  label: string; 
  status: 'pass' | 'fail' | 'warn';
  details: string;
}) {
  const styles = {
    pass: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    fail: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warn: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  };

  const icons = {
    pass: '✅',
    fail: '❌',
    warn: '⚠️',
  };

  return (
    <div className={`p-3 rounded-lg border ${styles[status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{icons[status]}</span>
          <span className="font-medium text-gray-900 dark:text-white">{label}</span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">{details}</span>
      </div>
    </div>
  );
}
