'use client';

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n-context';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function Navigation() {
  const pathname = usePathname();
  const { t, locale } = useI18n();

  const navItems = [
    { key: 'dashboard', href: '/', icon: '📊' },
    { key: 'config', href: '/config', icon: '🔧' },
    { key: 'analytics', href: '/analytics', icon: '📈' },
    { key: 'files', href: '/files', icon: '📁' },
    { key: 'cron', href: '/cron', icon: '⏰' },
    { key: 'chat', href: '/chat', icon: '💬' },
    { key: 'logs', href: '/logs', icon: '📋' },
    { key: 'settings', href: '/settings', icon: '⚙️' },
  ];

  const dateFormat = locale === 'zh-TW' ? 'zh-TW' : 'en-US';

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🦞</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              OpenClaw
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{t(item.key)}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString(dateFormat)}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
