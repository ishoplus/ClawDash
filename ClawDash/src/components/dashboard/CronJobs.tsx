import { useState, useEffect } from 'react';
import { useToast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n-context';

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: {
    kind: string;
    expr?: string;
    tz?: string;
  };
  sessionTarget: string;
  nextRunAt?: string;
  model?: string;
}

interface CronJobsProps {
  jobs: CronJob[];
  currentAgent?: string;
}

export function CronJobs({ jobs, currentAgent }: CronJobsProps) {
  const { showToast } = useToast();
  const { t } = useI18n();
  const [toggling, setToggling] = useState<string | null>(null);
  const [localJobs, setLocalJobs] = useState(jobs);

  useEffect(() => {
    if (!toggling) {
      setLocalJobs(jobs);
    }
  }, [jobs, toggling]);

  const toggleJob = async (jobId: string, currentlyEnabled: boolean) => {
    const action = currentlyEnabled ? 'disable' : 'enable';
    setToggling(jobId);
    
    try {
      const response = await fetch(
        `/api/dashboard/cron?id=${encodeURIComponent(jobId)}&action=${action}`,
        { method: 'PATCH' }
      );
      
      if (response.ok) {
        showToast(`Cron ${currentlyEnabled ? t('disabled') : t('enabled')}`, 'success');
        setLocalJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, enabled: !currentlyEnabled } : job
        ));
      } else {
        const error = await response.json();
        showToast(`${t('error')}: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Error toggling cron job:', error);
      showToast(t('error'), 'error');
    } finally {
      setToggling(null);
    }
  };

  const displayJobs = localJobs;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        ⏰ {t('scheduledTasks')}
      </h2>
      {jobs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('noCronJobs')}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Use <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">openclaw cron add</code>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`border rounded-lg p-4 ${
                job.enabled
                  ? 'border-green-200 dark:border-green-800'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      job.enabled
                        ? 'bg-green-500'
                        : 'bg-gray-400 dark:bg-gray-600'
                    }`}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {job.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleJob(job.id, job.enabled)}
                    disabled={toggling === job.id}
                    className={`px-3 py-2 text-sm min-w-[70px] rounded-lg transition-colors disabled:opacity-50 touch-manipulation ${
                      job.enabled
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                    }`}
                  >
                    {toggling === job.id ? '...' : job.enabled ? '⏹️ ' + t('disabled') : '▶️ ' + t('enabled')}
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('schedule')}:
                  </span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {job.schedule.expr}
                  </span>
                </div>
                {job.schedule.tz && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('timezone')}:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {job.schedule.tz}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('target')}:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {job.sessionTarget}
                  </span>
                </div>
                {job.nextRunAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('nextRun')}:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {job.nextRunAt}
                    </span>
                  </div>
                )}
                {job.model && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Model:
                    </span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {job.model}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
