'use client';

import { Navigation } from '@/components/layout/Navigation';
import { TokenTrends } from '@/components/dashboard/TokenTrends';
import { WorkloadStats } from '@/components/dashboard/WorkloadStats';
import { ErrorEvents } from '@/components/dashboard/ErrorEvents';
import { useI18n } from '@/lib/i18n-context';

export default function AnalyticsPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📈 {t('tokenTrends')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('workloadStats')}
          </p>
        </div>

        <div className="space-y-6">
          <TokenTrends />
          <WorkloadStats />
          <ErrorEvents />
        </div>
      </div>
    </div>
  );
}
