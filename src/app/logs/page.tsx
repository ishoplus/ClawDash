'use client';

import { Navigation } from '@/components/layout/Navigation';
import { LogViewer } from '@/components/dashboard/LogViewer';

export default function LogsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📋 Gateway 日誌
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            查看 Gateway 運行日誌
          </p>
        </div>

        <LogViewer />
      </div>
    </div>
  );
}
