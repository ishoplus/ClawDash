'use client';

import { useEffect, useState, use } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { AgentSelector } from '@/components/agents/AgentSelector';

interface WorkspaceFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

export default function AgentFilesPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await fetch(`/api/dashboard/files?agent=${agentId}&path=${currentPath}`);
        if (res.ok) {
          const data = await res.json();
          setFiles(data.files || []);
        }
      } catch (e) {
        console.error('Failed to fetch files:', e);
        // 模擬資料
        setFiles([
          { name: 'src', path: '/src', type: 'directory' },
          { name: 'package.json', path: '/package.json', type: 'file', size: 1024, modified: new Date().toISOString() },
          { name: 'README.md', path: '/README.md', type: 'file', size: 2048, modified: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, [agentId, currentPath]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* 頁面標題與 Agent 選擇器 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              📁 {agentId} 工作檔案
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              目前路徑: {currentPath}
            </p>
          </div>
          <AgentSelector variant="dropdown" />
        </div>

        {/* 檔案列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          {/* 工具列 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPath('/')}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                🏠 根目錄
              </button>
              <button
                onClick={() => {
                  const parts = currentPath.split('/');
                  if (parts.length > 1) {
                    parts.pop();
                    setCurrentPath(parts.join('/') || '/');
                  }
                }}
                disabled={currentPath === '/'}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                ← 上一層
              </button>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {files.length} 個項目
            </span>
          </div>

          {/* 檔案表格 */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {files.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  onClick={() => {
                    if (file.type === 'directory') {
                      setCurrentPath(file.path);
                    }
                  }}
                >
                  <span className="text-2xl mr-4">
                    {file.type === 'directory' ? '📁' : '📄'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {file.type === 'directory' ? '資料夾' : `${(file.size || 0).toLocaleString()} bytes`}
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">
                    →
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
