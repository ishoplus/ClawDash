interface WorkspaceFile {
  name: string;
  type: 'file' | 'dir';
  size?: number;
  modified: string;
}

interface WorkspaceFilesProps {
  files: WorkspaceFile[];
}

export function WorkspaceFiles({ files }: WorkspaceFilesProps) {
  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        📁 工作目录
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                名称
              </th>
              <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                类型
              </th>
              <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                大小
              </th>
              <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                修改时间
              </th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="py-2 px-3">
                  <span className="text-gray-900 dark:text-white font-medium">
                    {file.name}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      file.type === 'dir'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {file.type === 'dir' ? '📁' : '📄'}
                  </span>
                </td>
                <td className="py-2 px-3 text-right font-mono text-gray-600 dark:text-gray-400">
                  {formatSize(file.size)}
                </td>
                <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                  {file.modified}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
