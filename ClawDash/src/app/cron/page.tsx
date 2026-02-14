'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { CronJobs } from '@/components/dashboard/CronJobs';
import type { CronJob } from '../api/dashboard/route';
import { useI18n } from '@/lib/i18n-context';

export default function CronPage() {
  const { t } = useI18n();
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setCronJobs(data.cronJobs || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ⏰ {t('cron')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('scheduledTasks')}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <CronJobs jobs={cronJobs} />
        )}
      </div>
    </div>
  );
}
