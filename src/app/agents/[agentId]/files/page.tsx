'use client';

import { useEffect, useState, use } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { AgentSelector } from '@/components/agents/AgentSelector';

interface WorkspaceFile {
  id: number;
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

  useEffect(() => {
    async function fetchFiles() {
      setLoading(true);
      try {
        // 使用預設路徑（根目錄）
        const url = `/api/dashboard/files?agent=${agentId}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setFiles((data.files || []).map((f: any, idx: number) => ({
            id: idx,
            name: f.name,
            path: f.type === 'dir' ? `/${f.name}` : f.path || `/${f.name}`,
            type: f.type === 'dir' ? 'directory' : 'file',
            size: f.size,
            modified: f.modified
          })));
        }
      } catch (e) {
        console.error('Failed to fetch files:', e);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, [agentId]); // 移除 currentPath，只依賴 agentId

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
              根目錄
            </p>
          </div>
          <AgentSelector variant="dropdown" />
        </div>

        {/* 檔案列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          {/* 工具列 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
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
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
                  <span className="text-4xl mb-4">📁</span>
                  <p>此目錄為空</p>
                </div>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
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
                    <span className="text-xs text-gray-400 mr-3">
                      {file.modified}
                    </span>
                    <span className="text-sm text-gray-400">
                      →
                    </span>
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
