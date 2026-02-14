export const translations: Record<Locale, Record<string, string>> = {
  'zh-TW': {
    // Navigation
    dashboard: '儀表盤',
    config: '配置',
    analytics: '分析',
    files: '工作目錄',
    cron: '排程任務',
    chat: '對話',
    logs: '日誌',
    settings: '設定',
    
    // Config
    configuration: '配置總覽',
    apiKey: 'API Key',
    channels: '通道',
    skills: '技能',
    provider: '提供商',
    model: '模型',
    setupGuide: '設定指南',
    quickStart: '快速開始',
    completeSetup: '完成設定',
    testConnection: '測試連線',
    change: '變更',
    skip: '略過',
    recommended: '推薦',
    risk: '風險',
    highRisk: '高風險',
    mediumRisk: '中風險',
    lowRisk: '低風險',
    enable: '啟用',
    disable: '停用',
    configured: '已設定',
    notConfigured: '未設定',
    configuredCount: '已設定 {count}/{total}',
    readyToUse: '準備就緒',
    requiresAttention: '需要關注',
    allSet: '所有設定完成',
    
    // Providers
    anthropic: 'Anthropic (Claude)',
    openai: 'OpenAI (GPT)',
    google: 'Google (Gemini)',
    
    // Channel names
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    discord: 'Discord',
    telegramTokenHelp: '從 @BotFather 取得 Bot Token',
    whatsappTokenHelp: '從 WhatsApp Business API 取得 Token',
    discordTokenHelp: '從 Discord Developer Portal 取得 Token',
    token: 'Token / Bot Token',
    
    // Common
    loading: '載入中...',
    error: '錯誤',
    success: '成功',
    cancel: '取消',
    confirm: '確定',
    delete: '刪除',
    edit: '編輯',
    save: '保存',
    close: '關閉',
    back: '返回',
    refresh: '刷新',
    install: '安裝',
    start: '啟動',
    stop: '停止',
    restart: '重啟',
    user: '你',
    system: '系統',
    
    // Environment Check
    environmentCheck: '環境檢查',
    environmentReady: '環境就緒',
    environmentNotReady: '環境異常',
    openclawCli: 'OpenClaw CLI',
    gatewayService: 'Gateway 服務',
    workspaceDir: '工作目錄',
    nodeJs: 'Node.js',
    installed: '已安裝',
    notInstalled: '未安裝',
    running: '運行中',
    notRunning: '未運行',
    installationGuide: '安裝指南',
    
    // Alerts
    setupProgress: '設定進度',
    noApiKeyTitle: '未配置 API Key',
    noApiKeyMessage: '需要 API Key 才能使用 AI 功能。',
    apiConfiguredTitle: '已配置 {provider}',
    apiConfiguredMessage: 'AI 模型已就緒。',
    gatewayStoppedTitle: 'Gateway 未運行',
    gatewayStoppedMessage: '請啟動 Gateway 服務以啟用完整功能。',
    noChannelsTitle: '未配置訊息通道',
    noChannelsMessage: '配置訊息通道以與 AI 進行通訊。',
    singleChannelTitle: '已配置 {count} 個通道',
    singleChannelMessage: '建議添加更多通道以提高可靠性。',
    fewSkillsTitle: '已啟用 {count} 個技能',
    fewSkillsMessage: '探索更多技能以解鎖附加功能。',
    noSkillsTitle: '未啟用技能',
    noSkillsMessage: '啟用技能以擴展 OpenClaw 功能。',
    oldNodeTitle: 'Node.js 版本警告',
    oldNodeMessage: '建議使用 Node.js 22+ 以獲得最佳兼容性。',
  },
  'en': {
    // Navigation
    dashboard: 'Dashboard',
    config: 'Config',
    analytics: 'Analytics',
    files: 'Files',
    cron: 'Cron',
    chat: 'Chat',
    logs: 'Logs',
    settings: 'Settings',
    
    // Config
    configuration: 'Configuration',
    apiKey: 'API Key',
    channels: 'Channels',
    skills: 'Skills',
    provider: 'Provider',
    model: 'Model',
    setupGuide: 'Setup Guide',
    quickStart: 'Quick Start',
    completeSetup: 'Complete Setup',
    testConnection: 'Test Connection',
    change: 'Change',
    skip: 'Skip',
    recommended: 'Recommended',
    risk: 'Risk',
    highRisk: 'High Risk',
    mediumRisk: 'Medium Risk',
    lowRisk: 'Low Risk',
    enable: 'Enable',
    disable: 'Disable',
    configured: 'Configured',
    notConfigured: 'Not Configured',
    configuredCount: '{count}/{total} configured',
    readyToUse: 'Ready to Use',
    requiresAttention: 'Requires Attention',
    allSet: 'All Set',
    
    // Providers
    anthropic: 'Anthropic (Claude)',
    openai: 'OpenAI (GPT)',
    google: 'Google (Gemini)',
    
    // Channel names
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    discord: 'Discord',
    telegramTokenHelp: 'Get bot token from @BotFather',
    whatsappTokenHelp: 'Get token from WhatsApp Business API',
    discordTokenHelp: 'Get token from Discord Developer Portal',
    token: 'Token / Bot Token',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    close: 'Close',
    back: 'Back',
    refresh: 'Refresh',
    install: 'Install',
    start: 'Start',
    stop: 'Stop',
    restart: 'Restart',
    user: 'You',
    system: 'System',
    
    // Environment Check
    environmentCheck: 'Environment Check',
    environmentReady: 'Environment Ready',
    environmentNotReady: 'Environment Not Ready',
    openclawCli: 'OpenClaw CLI',
    gatewayService: 'Gateway Service',
    workspaceDir: 'Workspace',
    nodeJs: 'Node.js',
    installed: 'Installed',
    notInstalled: 'Not Installed',
    running: 'Running',
    notRunning: 'Not Running',
    installationGuide: 'Installation Guide',
    
    // Alerts
    setupProgress: 'Setup Progress',
    noApiKeyTitle: 'No API Key Configured',
    noApiKeyMessage: 'OpenClaw needs an API key to use AI models. Add one to start using AI features.',
    apiConfiguredTitle: 'Using {provider}',
    apiConfiguredMessage: 'AI model is configured and ready to use.',
    gatewayStoppedTitle: 'Gateway Not Running',
    gatewayStoppedMessage: 'The OpenClaw Gateway service is not running. Start it to enable full functionality.',
    noChannelsTitle: 'No Messaging Channels',
    noChannelsMessage: 'Configure a messaging channel (Telegram, WhatsApp) to communicate with your AI.',
    singleChannelTitle: '{count} Channel Configured',
    singleChannelMessage: 'Consider adding more channels for redundancy.',
    fewSkillsTitle: '{count} Skill(s) Enabled',
    fewSkillsMessage: 'Explore more skills to unlock additional features.',
    noSkillsTitle: 'No Skills Enabled',
    noSkillsMessage: 'Enable some skills to extend OpenClaw capabilities.',
    oldNodeTitle: 'Node.js Version Warning',
    oldNodeMessage: 'You are using an older Node.js version. OpenClaw recommends Node.js 22+ for best compatibility.',
  }
};

export type Locale = 'zh-TW' | 'en';

export function getLocale(): Locale {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('locale') as Locale;
    if (saved && translations[saved]) {
      return saved;
    }
    
    // Check browser language
    const browserLang = navigator.language;
    if (browserLang.startsWith('zh')) {
      return 'zh-TW';
    }
  }
  return 'en';
}

export function setLocale(locale: Locale) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);
  }
}

export function t(locale: Locale, key: string): string {
  return translations[locale]?.[key] || translations['en'][key] || key;
}
