'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { useI18n } from '@/lib/i18n-context';

interface ConfigStatus {
  apiKey: {
    configured: boolean;
    provider: string | null;
    model: string | null;
  };
  channels: {
    telegram: { configured: boolean; enabled?: boolean };
    whatsapp: { configured: boolean; enabled?: boolean };
    discord: { configured: boolean; enabled?: boolean };
  };
  skills: {
    total: number;
    enabled: number;
  };
  gateway: {
    running: boolean;
  };
}

interface Provider {
  id: string;
  name: string;
  icon: string;
  models: string[];
}

const PROVIDERS: Provider[] = [
  { id: 'anthropic', name: 'Anthropic (Claude)', icon: '🤖', models: ['claude-sonnet-4', 'claude-haiku-3'] },
  { id: 'openai', name: 'OpenAI (GPT)', icon: '🟢', models: ['gpt-4o', 'gpt-4o-mini'] },
  { id: 'google', name: 'Google (Gemini)', icon: '🔵', models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
];

const CHANNELS = [
  { id: 'telegram', name: 'Telegram', icon: '✈️', color: 'bg-blue-500', help: 'telegramTokenHelp' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: 'bg-green-500', help: 'whatsappTokenHelp' },
  { id: 'discord', name: 'Discord', icon: '🎮', color: 'bg-indigo-500', help: 'discordTokenHelp' },
];

export default function ConfigPage() {
  const { t } = useI18n();
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'apikey' | 'channels' | 'skills'>('overview');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  const [channelToken, setChannelToken] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [savingChannel, setSavingChannel] = useState(false);
  const [skillsData, setSkillsData] = useState<any>(null);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [selectedRiskTab, setSelectedRiskTab] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [savingSkills, setSavingSkills] = useState(false);

  const configuredCount = configStatus ? 
    (configStatus.apiKey.configured ? 1 : 0) +
    Object.values(configStatus.channels).filter(c => c.configured).length : 0;

  // Also count enabled skills
  const skillsEnabled = skillsData?.stats?.enabled || 0;

  useEffect(() => {
    fetchConfigStatus();
  }, []);

  const fetchConfigStatus = async () => {
    try {
      const res = await fetch('/api/dashboard/config');
      if (res.ok) {
        const data = await res.json();
        setConfigStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch config status:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async () => {
    if (!selectedProvider || !apiKeyInput) {
      setMessage({ type: 'error', text: 'Please select provider and enter API Key' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/dashboard/config/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKeyInput,
          model: selectedModel
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'API Key saved successfully' });
        setApiKeyInput('');
        fetchConfigStatus();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to save API Key' });
    } finally {
      setSaving(false);
    }
  };

  const removeApiKey = async (provider: string) => {
    try {
      const res = await fetch(`/api/dashboard/config/apikey?provider=${provider}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `${provider} API Key removed` });
        fetchConfigStatus();
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to remove API Key' });
    }
  };

  const saveChannel = async () => {
    if (!selectedChannel || !channelToken) {
      setMessage({ type: 'error', text: 'Please select channel and enter token' });
      return;
    }

    setSavingChannel(true);
    setMessage(null);

    try {
      const res = await fetch('/api/dashboard/config/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: selectedChannel,
          token: channelToken
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `${CHANNELS.find(c => c.id === selectedChannel)?.name} configured successfully` });
        setChannelToken('');
        setSelectedChannel('');
        fetchConfigStatus();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to save channel' });
    } finally {
      setSavingChannel(false);
    }
  };

  const removeChannel = async (channelId: string) => {
    try {
      const res = await fetch(`/api/dashboard/config/channels?channel=${channelId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `${CHANNELS.find(c => c.id === channelId)?.name} removed` });
        fetchConfigStatus();
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to remove channel' });
    }
  };

  const fetchSkills = async () => {
    setLoadingSkills(true);
    try {
      const res = await fetch('/api/dashboard/config/skills');
      if (res.ok) {
        const data = await res.json();
        setSkillsData(data);
      }
    } catch (e) {
      console.error('Failed to fetch skills:', e);
    } finally {
      setLoadingSkills(false);
    }
  };

  const toggleSkill = async (skillName: string, enabled: boolean) => {
    setSavingSkills(true);
    try {
      const res = await fetch('/api/dashboard/config/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: enabled ? 'disable' : 'enable',
          skills: [skillName]
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `${skillName} ${enabled ? 'disabled' : 'enabled'}` });
        fetchSkills();
        fetchConfigStatus();
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to update skill' });
    } finally {
      setSavingSkills(false);
    }
  };

  const enableAllLowRisk = async () => {
    setSavingSkills(true);
    try {
      const res = await fetch('/api/dashboard/config/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enableAllLow'
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'All low-risk skills enabled' });
        fetchSkills();
        fetchConfigStatus();
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to enable skills' });
    } finally {
      setSavingSkills(false);
    }
  };

  // Load skills when switching to skills tab
  useEffect(() => {
    if (activeTab === 'skills' && !skillsData) {
      fetchSkills();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔧 {t('configuration')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {configuredCount > 0 
              ? `${configuredCount}/4 ${t('configured').toLowerCase()}`
              : t('quickStart')}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('quickStart')}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {configuredCount}/4 {t('completeSetup').toLowerCase()}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(configuredCount / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'overview', label: t('quickStart'), icon: '📋' },
            { key: 'apikey', label: t('apiKey'), icon: '🔑' },
            { key: 'channels', label: t('channels'), icon: '📱' },
            { key: 'skills', label: t('skills'), icon: '🔧' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {message.text}
            <button 
              onClick={() => setMessage(null)}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* API Key Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔑</span>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{t('apiKey')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {configStatus?.apiKey.configured 
                        ? `${configStatus.apiKey.provider} • ${configStatus.apiKey.model}`
                        : t('notConfigured')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {configStatus?.apiKey.configured ? (
                    <>
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full">
                        {t('configured')}
                      </span>
                      <button
                        onClick={() => setActiveTab('apikey')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        {t('change')}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setActiveTab('apikey')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      {t('setupGuide')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Channels Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{t('channels')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {Object.values(configStatus?.channels || {}).filter(c => c.configured).length}/3 {t('configured').toLowerCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('channels')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  {configStatus?.channels.telegram.configured || configStatus?.channels.whatsapp.configured 
                    ? t('change') 
                    : t('setupGuide')}
                </button>
              </div>
              <div className="flex gap-3">
                {CHANNELS.map((channel) => {
                  const configured = configStatus?.channels[channel.id as keyof typeof configStatus.channels]?.configured;
                  return (
                    <div
                      key={channel.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        configured 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <span>{channel.icon}</span>
                      <span className={`text-sm ${configured ? 'text-green-700 dark:text-green-300' : 'text-gray-500'}`}>
                        {channel.name}
                      </span>
                      {configured && <span className="text-green-600">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skills Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔧</span>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{t('skills')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {skillsEnabled} {t('enabled').toLowerCase()}
                      {skillsData?.stats && (
                        <span className="ml-2">
                          ({skillsData.stats.lowRiskEnabled} low, {skillsData.stats.mediumRiskEnabled} medium, {skillsData.stats.highRiskEnabled} high)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('skills');
                    fetchSkills();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  {skillsEnabled > 0 ? t('change') : 'Manage'}
                </button>
              </div>
            </div>

            {/* Gateway Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🦞</span>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Gateway</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {configStatus?.gateway.running ? t('running') : t('notRunning')}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 ${configStatus?.gateway.running 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'} text-sm rounded-full`}
                >
                  {configStatus?.gateway.running ? t('running') : t('notRunning')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* API Key Tab */}
        {activeTab === 'apikey' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              🔑 {t('apiKey')}
            </h3>

            {/* Current providers */}
            {configStatus?.apiKey.configured && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('configured')} {t('provider')}
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {PROVIDERS.find(p => p.id === configStatus.apiKey.provider)?.icon}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {PROVIDERS.find(p => p.id === configStatus.apiKey.provider)?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('model')}: {configStatus.apiKey.model}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeApiKey(configStatus.apiKey.provider!)}
                    className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sm"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            )}

            {/* Add new provider */}
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('setupGuide')}
            </h4>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelectedProvider(provider.id);
                    setSelectedModel(provider.models[0]);
                  }}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    selectedProvider === provider.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">{provider.icon}</span>
                  <span className="text-sm text-gray-900 dark:text-white">{provider.name}</span>
                </button>
              ))}
            </div>

            {selectedProvider && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('model')}
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {PROVIDERS.find(p => p.id === selectedProvider)?.models.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={saveApiKey}
                  disabled={saving || !apiKeyInput}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? t('loading') : t('save')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              📱 {t('channels')}
            </h3>

            {/* Channel cards */}
            <div className="space-y-4">
              {CHANNELS.map((channel) => {
                const configured = configStatus?.channels[channel.id as keyof typeof configStatus.channels]?.configured;
                const isExpanded = expandedChannel === channel.id;
                const channelData = configStatus?.channels[channel.id as keyof typeof configStatus.channels];

                return (
                  <div
                    key={channel.id}
                    className={`border-2 rounded-lg transition-all ${
                      configured 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Header */}
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedChannel(isExpanded ? null : channel.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-10 h-10 ${channel.color} rounded-full flex items-center justify-center text-white`}>
                            {channel.icon}
                          </span>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{channel.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {configured ? t('configured') : t('notConfigured')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {configured && (
                            <span className="text-green-600">✓</span>
                          )}
                          <span className="text-gray-400">
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded configuration */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0">
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          {!configured ? (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  {t('token')}
                                </label>
                                <input
                                  type="password"
                                  value={channelToken}
                                  onChange={(e) => setChannelToken(e.target.value)}
                                  placeholder={channel.id === 'telegram' ? '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11' : 'Enter token'}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedChannel(channel.id);
                                  saveChannel();
                                }}
                                disabled={savingChannel || !channelToken}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                              >
                                {savingChannel ? t('loading') : t('save')}
                              </button>

                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                💡 {t(channel.help as any)}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <span className="text-green-700 dark:text-green-300">
                                  ✓ {t('configured')}
                                </span>
                                <button
                                  onClick={() => removeChannel(channel.id)}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  {t('delete')}
                                </button>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {t('enabled')}
                                </span>
                                <button
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    channelData?.enabled
                                      ? 'bg-blue-600'
                                      : 'bg-gray-300 dark:bg-gray-600'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      channelData?.enabled
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              💡 {t('telegramTokenHelp')}
            </p>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                🔧 {t('skills')}
              </h3>
              <button
                onClick={enableAllLowRisk}
                disabled={savingSkills || !skillsData?.stats?.lowRisk}
                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                Enable All Low Risk
              </button>
            </div>

            {/* Stats */}
            {skillsData?.stats && (
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {skillsData.stats.total}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {skillsData.stats.enabled}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Enabled</p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {skillsData.stats.highRiskEnabled}/{skillsData.stats.highRisk}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">High Risk</p>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                    {skillsData.stats.lowRiskEnabled}/{skillsData.stats.lowRisk}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Low Risk</p>
                </div>
              </div>
            )}

            {/* Risk Level Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {[
                { key: 'all', label: 'All', icon: '📋' },
                { key: 'high', label: 'High Risk', icon: '🔴', color: 'text-red-600' },
                { key: 'medium', label: 'Medium Risk', icon: '🟡', color: 'text-yellow-600' },
                { key: 'low', label: 'Low Risk', icon: '🟢', color: 'text-green-600' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedRiskTab(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedRiskTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Skills List */}
            {loadingSkills ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Loading skills...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {skillsData?.categorized && (
                  <>
                    {(selectedRiskTab === 'all' ? skillsData.skills : skillsData.categorized[selectedRiskTab] || []).map((skill: any) => (
                      <div
                        key={skill.name}
                        className={`border-2 rounded-lg p-4 ${
                          skill.riskLevel === 'high' 
                            ? 'border-red-300 bg-red-50 dark:bg-red-900/10' 
                            : skill.riskLevel === 'medium'
                            ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10'
                            : 'border-green-300 bg-green-50 dark:bg-green-900/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{skill.emoji}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">{skill.name}</h4>
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  skill.riskLevel === 'high' 
                                    ? 'bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-300'
                                    : skill.riskLevel === 'medium'
                                    ? 'bg-yellow-200 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                    : 'bg-green-200 text-green-700 dark:bg-green-900 dark:text-green-300'
                                }`}>
                                  {skill.riskLevel.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {skill.description}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {skill.riskReason}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleSkill(skill.name, skill.enabled)}
                            disabled={savingSkills}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              skill.enabled 
                                ? 'bg-blue-600' 
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                skill.enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {!skillsData?.skills?.length && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <span className="text-4xl block mb-2">🔧</span>
                    <p>No skills found</p>
                  </div>
                )}
              </div>
            )}

            {/* Risk Warning */}
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">⚠️ Risk Guidelines</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>🔴 <strong>High Risk:</strong> Can execute arbitrary code or modify files. Enable only if needed.</li>
                <li>🟡 <strong>Medium Risk:</strong> Access to external services (GitHub, Google, etc.).</li>
                <li>🟢 <strong>Low Risk:</strong> Read-only or informational skills with no side effects.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
