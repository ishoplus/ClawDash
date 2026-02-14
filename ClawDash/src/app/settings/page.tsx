'use client';

import { useSettings } from '@/lib/settings-context';
import { Navigation } from '@/components/layout/Navigation';
import { EnvironmentCheck } from '@/components/dashboard/EnvironmentCheck';
import { useI18n } from '@/lib/i18n-context';

export default function SettingsPage() {
  const { t } = useI18n();
  const { settings, updateSettings } = useSettings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ⚙️ {t('settings')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('settings')}
          </p>
        </div>

        <div className="mb-6">
          <EnvironmentCheck />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {t('refreshInterval')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('refreshInterval')}
              </p>
            </div>
            <select
              value={settings.refreshInterval}
              onChange={(e) => updateSettings({ refreshInterval: Number(e.target.value) })}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            >
              <option value={10}>10 {t('seconds')}</option>
              <option value={30}>30 {t('seconds')}</option>
              <option value={60}>1 {t('minute')}</option>
              <option value={0}>{t('off')}</option>
            </select>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {t('darkMode')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('darkMode')}
              </p>
            </div>
            <button
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="text-xs text-green-600 dark:text-green-400 text-center">
            ✓ {t('success')}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              About
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>OpenClaw Dashboard v1.1.0</p>
              <p>Built with Next.js, TypeScript, Tailwind CSS</p>
              <p className="pt-2">
                <a 
                  href="https://github.com/openclaw/openclaw" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500"
                >
                  GitHub →
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
