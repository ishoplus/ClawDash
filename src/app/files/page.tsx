'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { WorkspaceFileExplorer } from '@/components/dashboard/WorkspaceFileExplorer';
import type { WorkspaceFile } from '../api/dashboard/route';
import { useI18n } from '@/lib/i18n-context';

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  displayName: string;
}

export default function FilesPage() {
  const { t } = useI18n();
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('code');
  const [availableAgents, setAvailableAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/agents')
      .then(res => res.json())
      .then(data => {
        setAvailableAgents(data);
        if (data.length > 0 && !data.find((a: AgentInfo) => a.id === selectedAgent)) {
          setSelectedAgent(data[0].id);
        }
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?agent=${selectedAgent}`)
      .then(res => res.json())
      .then(data => {
        setFiles(data.workspace || []);
        setLoading(false);
      });
  }, [selectedAgent]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📁 {t('files')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('workspace')}
            </p>
          </div>

          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.displayName}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <WorkspaceFileExplorer files={files} agentId={selectedAgent} />
        )}
      </div>
    </div>
  );
}
