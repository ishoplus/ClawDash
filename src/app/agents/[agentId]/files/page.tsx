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

interface FilePreview {
  name: string;
  content?: string;
  size?: number;
  modified?: string;
  error?: string;
}

export default function AgentFilesPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<FilePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 獲取目錄內容
  useEffect(() => {
    async function fetchFiles() {
      setLoading(true);
      try {
        const pathParam = currentPath.length > 0 ? `/${currentPath.join('/')}` : '';
        const url = `/api/dashboard/files?agent=${agentId}${pathParam ? `&path=${encodeURIComponent(pathParam)}` : ''}`;
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
  }, [agentId, currentPath]);

  // 進入資料夾
  const navigateToFolder = (folderName: string) => {
    setCurrentPath([...currentPath, folderName]);
    setPreviewFile(null);
  };

  // 返回上一層
  const navigateUp = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
      setPreviewFile(null);
    }
  };

  // 預覽檔案
  const previewFileContent = async (file: WorkspaceFile) => {
    if (file.type === 'directory') return;
    
    setPreviewLoading(true);
    try {
      const pathParam = currentPath.length > 0 ? `/${currentPath.join('/')}` : '';
      const filePath = pathParam ? `${pathParam}/${file.name}` : `/${file.name}`;
      
      const res = await fetch(`/api/dashboard/file?agent=${agentId}&path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewFile({
          name: file.name,
          content: data.content,
          size: file.size,
          modified: file.modified
        });
      } else {
        const error = await res.json().catch(() => ({ error: '無法讀取檔案' }));
        setPreviewFile({
          name: file.name,
          error: error.error || '無法預覽此檔案'
        });
      }
    } catch (e) {
      setPreviewFile({
        name: file.name,
        error: '無法預覽此檔案'
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // 關閉預覽
  const closePreview = () => {
    setPreviewFile(null);
  };

  const pathDisplay = currentPath.length > 0 ? `/${currentPath.join('/')}` : '根目錄';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      {/* 檔案預覽 Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closePreview}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{previewFile.name}</h3>
                  {previewFile.size && (
                    <p className="text-xs text-gray-500">{previewFile.size.toLocaleString()} bytes</p>
                  )}
                </div>
              </div>
              <button
                onClick={closePreview}
                className="px-3 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {previewLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : previewFile.error ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
                  <span className="text-4xl mb-4">⚠️</span>
                  <p>{previewFile.error}</p>
                </div>
              ) : previewFile.content ? (
                <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto">
                  {previewFile.content}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
                  <span className="text-4xl mb-4">📄</span>
                  <p>此檔案無法預覽</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* 頁面標題與 Agent 選擇器 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              📁 {agentId} 工作檔案
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {pathDisplay}
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
                onClick={() => {
                  setCurrentPath([]);
                  setPreviewFile(null);
                }}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                🏠 根目錄
              </button>
              <button
                onClick={navigateUp}
                disabled={currentPath.length === 0}
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
                    onClick={() => file.type === 'directory' ? navigateToFolder(file.name) : previewFileContent(file)}
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
                      {file.type === 'directory' ? '→' : '👁️'}
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
