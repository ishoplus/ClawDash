'use client';

import { useEffect, useState, useCallback } from 'react';
import { MarkdownPreview } from './MarkdownPreview';
import { useToast } from '@/lib/toast';
import type { WorkspaceFile } from '../../lib/types';
import { useI18n } from '@/lib/i18n-context';

interface WorkspaceFileExplorerProps {
  files: WorkspaceFile[];
  agentId: string;
}

export function WorkspaceFileExplorer({ files, agentId }: WorkspaceFileExplorerProps) {
  const { showToast } = useToast();
  const { t } = useI18n();
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [displayedFiles, setDisplayedFiles] = useState<WorkspaceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const basePath = '/Users/showang/.openclaw/workspaces/';

  useEffect(() => {
    setCurrentPath([]);
    setSelectedFile(null);
    setDisplayedFiles(files);
  }, [agentId, files]);

  const fetchDirectory = useCallback(async (path: string[]) => {
    setLoading(true);
    const currentPathStr = path.join('/');
    const fullPath = currentPathStr.length === 0 
      ? basePath + agentId 
      : basePath + agentId + '/' + currentPathStr;

    try {
      const response = await fetch(
        `/api/dashboard/files?agent=${agentId}&path=${encodeURIComponent(fullPath)}`
      );
      if (response.ok) {
        const data = await response.json();
        setDisplayedFiles(data.files);
      } else {
        console.error('Fetch failed:', response.status);
      }
    } catch (error) {
      console.error('Error fetching directory:', error);
    } finally {
      setLoading(false);
      setNavigatingTo(null);
    }
  }, [agentId]);

  const navigateToFolder = useCallback((folderName: string) => {
    setNavigatingTo(folderName);
    setSelectedFile(null);
    const newPath = [...currentPath, folderName];
    setCurrentPath(newPath);
    fetchDirectory(newPath);
  }, [currentPath, fetchDirectory]);

  const goBack = useCallback(() => {
    if (currentPath.length === 0) return;
    setNavigatingTo('..');
    setSelectedFile(null);
    const newPath = currentPath.slice(0, -1);
    setCurrentPath(newPath);
    fetchDirectory(newPath);
  }, [currentPath, fetchDirectory]);

  const selectFile = useCallback((file: WorkspaceFile) => {
    if (file.type === 'dir') {
      navigateToFolder(file.name);
    } else if (file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.json')) {
      const filePath = currentPath.length === 0 
        ? file.name 
        : currentPath.join('/') + '/' + file.name;
      setSelectedFile(filePath);
    }
  }, [currentPath, navigateToFolder]);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const breadcrumb = currentPath.length === 0 
    ? agentId 
    : `${agentId} / ${currentPath.join(' / ')}`;

  const downloadFile = useCallback(async (file: WorkspaceFile, e: React.MouseEvent) => {
    e.stopPropagation();
    const filePath = currentPath.length === 0 
      ? file.name 
      : currentPath.join('/') + '/' + file.name;
    
    try {
      const response = await fetch(
        `/api/dashboard/file?agent=${agentId}&path=${encodeURIComponent(filePath)}&action=download`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast(`${t('success')}: ${file.name}`, 'success');
      } else {
        const error = await response.json();
        showToast(`${t('error')}: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Download error:', error);
      showToast(t('error'), 'error');
    }
  }, [agentId, currentPath, showToast, t]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          📁 {selectedFile ? t('filePreview') : t('workspace')}
        </h2>
        {currentPath.length > 0 && (
          <button
            onClick={goBack}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            ⬆️ {t('goBack')}
          </button>
        )}
      </div>

      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        📂 {breadcrumb}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {navigatingTo ? `${navigatingTo}...` : t('loading')}
          </span>
        </div>
      )}

      {!loading && selectedFile ? (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-500">{t('filePreview')}:</span>
            <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
              {selectedFile}
            </span>
            <button
              onClick={() => setSelectedFile(null)}
              className="ml-auto text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕ {t('close')}
            </button>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-[500px] overflow-auto">
            <MarkdownPreview filePath={selectedFile} agentId={agentId} />
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium w-8">
                  Type
                </th>
                <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                  Name
                </th>
                <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium w-24">
                  Size
                </th>
                <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium w-32">
                  Modified
                </th>
                <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium w-16">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedFiles.map((file, index) => (
                <tr
                  key={`${file.name}-${index}`}
                  onClick={() => !loading && selectFile(file)}
                  className={`border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${
                    loading && navigatingTo === file.name
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  } ${file.type === 'dir' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <td className="py-2 px-3">
                    <span
                      className={`inline-block w-6 h-6 flex items-center justify-center rounded ${
                        file.type === 'dir'
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      {file.type === 'dir' ? '📁' : getFileIcon(file.name)}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {file.name}
                    </span>
                    {file.type === 'dir' && (
                      <span className="ml-2 text-xs text-blue-500 dark:text-blue-400">
                        (folder)
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-gray-600 dark:text-gray-400">
                    {formatSize(file.size)}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                    {file.modified}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {file.type === 'file' && (
                      <button
                        onClick={(e) => downloadFile(file, e)}
                        className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors touch-manipulation"
                        title={t('download')}
                      >
                        ⬇️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {displayedFiles.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('emptyFolder')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'md':
      return '📝';
    case 'json':
      return '📋';
    case 'txt':
      return '📄';
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return '💻';
    case 'html':
      return '🌐';
    case 'css':
      return '🎨';
    case 'png':
    case 'jpg':
    case 'gif':
      return '🖼️';
    case 'svg':
      return '🎯';
    default:
      return '📄';
  }
}
