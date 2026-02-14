'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error';
  category: 'api' | 'channel' | 'skill' | 'gateway' | 'system';
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
  dismissible: boolean;
}

interface AlertsResponse {
  alerts: Alert[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    completionScore: number;
  };
}

const alertIcons = {
  info: '💡',
  warning: '⚠️',
  error: '🚨'
};

const alertColors = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-600 dark:text-blue-400'
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: 'text-yellow-600 dark:text-yellow-400'
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-800 dark:text-red-200',
    icon: 'text-red-600 dark:text-red-400'
  }
};

export function AlertsBanner() {
  const [alertsData, setAlertsData] = useState<AlertsResponse | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/dashboard/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlertsData(data);
      }
    } catch (e) {
      console.error('Failed to fetch alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (!alertsData || alertsData.alerts.length === 0) {
    return null; // No alerts to show
  }

  // Filter out dismissed alerts
  const visibleAlerts = alertsData.alerts.filter(a => !dismissedAlerts.has(a.id));

  if (visibleAlerts.length === 0) {
    return null;
  }

  // Sort by priority: error > warning > info
  const sortedAlerts = [...visibleAlerts].sort((a, b) => {
    const priority = { error: 0, warning: 1, info: 2 };
    return priority[a.type] - priority[b.type];
  });

  return (
    <div className="space-y-3 mb-6">
      {/* Completion Score */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Setup Progress
          </span>
          <span className={`text-lg font-bold ${
            alertsData.summary.completionScore >= 80 
              ? 'text-green-600' 
              : alertsData.summary.completionScore >= 50 
              ? 'text-yellow-600' 
              : 'text-red-600'
          }`}>
            {alertsData.summary.completionScore}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              alertsData.summary.completionScore >= 80 
                ? 'bg-green-600' 
                : alertsData.summary.completionScore >= 50 
                ? 'bg-yellow-500' 
                : 'bg-red-500'
            }`}
            style={{ width: `${alertsData.summary.completionScore}%` }}
          ></div>
        </div>
      </div>

      {/* Alerts */}
      {sortedAlerts.map((alert) => {
        const colors = alertColors[alert.type];
        
        return (
          <div
            key={alert.id}
            className={`rounded-lg border p-4 ${colors.bg} ${colors.border}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{alertIcons[alert.type]}</span>
              
              <div className="flex-1">
                <h4 className={`font-medium ${colors.text}`}>
                  {alert.title}
                </h4>
                <p className={`text-sm mt-1 ${colors.text} opacity-80`}>
                  {alert.message}
                </p>
                
                {alert.action && (
                  <Link
                    href={alert.action.href}
                    className={`inline-block mt-2 text-sm font-medium ${colors.icon} hover:underline`}
                  >
                    {alert.action.label}
                  </Link>
                )}
              </div>
              
              {alert.dismissible && (
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className={`${colors.icon} hover:opacity-70`}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
