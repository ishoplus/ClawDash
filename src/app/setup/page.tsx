'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

export default function SetupPage() {
  const router = useRouter();
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [installOutput, setInstallOutput] = useState('');
  const [status, setStatus] = useState<'checking' | 'needs_install' | 'installing' | 'ready'>('checking');

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth(data.checks);
      
      if (data.status === 'ready') {
        setStatus('ready');
      } else if (!data.checks.openclaw.installed) {
        setStatus('needs_install');
      } else {
        setStatus('needs_install');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setStatus('needs_install');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const installOpenClaw = async () => {
    setInstalling(true);
    setStatus('installing');
    setInstallOutput('正在初始化安裝...\n');

    try {
      // Simulate installation steps with actual commands
      const steps = [
        { cmd: 'brew tap openclaw/openclaw', msg: '新增 Tap 源...' },
        { cmd: 'brew install openclaw', msg: '安裝 OpenClaw...' },
      ];

      for (const step of steps) {
        setInstallOutput(prev => prev + `\n${step.msg}`);
        try {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);
          await execAsync(step.cmd);
        } catch (e) {
          // Continue anyway - might already be installed
        }
      }

      setInstallOutput(prev => prev + '\n正在驗證安裝...');
      
      // Check again
      await checkHealth();
      
      if (health?.openclaw.installed) {
        setInstallOutput(prev => prev + '\n✅ 安裝成功！');
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (error) {
      setInstallOutput(prev => prev + `\n❌ 安裝失敗: ${error}`);
    } finally {
      setInstalling(false);
    }
  };

  const startGateway = async () => {
    setInstalling(true);
    setInstallOutput('正在啟動 Gateway...\n');
    
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      await execAsync('openclaw gateway start');
      setInstallOutput(prev => prev + '\n✅ Gateway 啟動成功！');
      setTimeout(() => {
        checkHealth();
      }, 2000);
    } catch (error) {
      setInstallOutput(prev => prev + `\n❌ 啟動失敗: ${error}`);
    } finally {
      setInstalling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">檢查環境中...</p>
        </div>
      </div>
    );
  }

  // Ready state
  if (status === 'ready') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">環境就緒！</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">正在跳轉到 Dashboard...</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            進入 Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Installing state
  if (status === 'installing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">正在設定...</h1>
          </div>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto max-h-64">
            {installOutput}
          </pre>
        </div>
      </div>
    );
  }

  // Needs installation
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🦞</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            歡迎使用 OpenClaw Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            讓我幫你檢查環境並完成設定
          </p>
        </div>

        {/* Check Results */}
        <div className="space-y-3 mb-8">
          <CheckRow 
            label="OpenClaw CLI" 
            status={health?.openclaw.installed ? 'ok' : 'error'}
            detail={health?.openclaw.version || '未安裝'}
          />
          <CheckRow 
            label="Gateway 服務" 
            status={health?.gateway.running ? 'ok' : 'error'}
            detail={health?.gateway.running ? `Port ${health.gateway.port}` : '未運行'}
          />
          <CheckRow 
            label="工作目錄" 
            status={health?.workspace.exists ? 'ok' : 'warn'}
            detail={health?.workspace.exists ? '已存在' : '將自動建立'}
          />
        </div>

        {/* Actions */}
        {!health?.openclaw.installed ? (
          <div className="space-y-4">
            <button
              onClick={installOpenClaw}
              disabled={installing}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>⬇️</span>
              {installing ? '安裝中...' : '一鍵安裝 OpenClaw'}
            </button>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              或自行在終端機執行: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">brew install openclaw</code>
            </p>
          </div>
        ) : !health?.gateway.running ? (
          <button
            onClick={startGateway}
            disabled={installing}
            className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>🚀</span>
            {installing ? '啟動中...' : '啟動 Gateway'}
          </button>
        ) : null}

        {/* Manual Skip */}
        <button
          onClick={() => router.push('/')}
          className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm"
        >
          跳過，稍後設定 →
        </button>
      </div>
    </div>
  );
}

function CheckRow({ label, status, detail }: { 
  label: string; 
  status: 'ok' | 'error' | 'warn'; 
  detail: string;
}) {
  const icons = { ok: '✅', error: '❌', warn: '⚠️' };
  const colors = { 
    ok: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warn: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${colors[status]}`}>
      <div className="flex items-center gap-2">
        <span>{icons[status]}</span>
        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400">{detail}</span>
    </div>
  );
}
