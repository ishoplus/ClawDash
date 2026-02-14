export interface WorkspaceFile {
  name: string;
  type: 'file' | 'dir';
  size?: number;
  modified: string;
}

export interface SessionInfo {
  key: string;
  kind: string;
  agentId: string;
  channel: string;
  displayName: string;
  updatedAt: string;
  model: string;
  contextTokens: number;
  totalTokens: number;
  inputTokens?: number;
  outputTokens?: number;
  sessionId?: string;
}

export interface CronJob {
  id: string;
  name: string;
  enabled?: boolean;
  schedule?: {
    kind?: string;
    expr?: string;
    tz?: string;
  };
  sessionTarget: string;
  nextRunAt?: string;
}

export interface DashboardData {
  agent: {
    name: string;
    role: string;
    model: string;
    sessionKey: string;
    tokenUsage: {
      input: number;
      output: number;
      total: number;
    };
    context: string;
    channel: string;
    displayName: string;
  };
  workspace: WorkspaceFile[];
  activeSessions: SessionInfo[];
  cronJobs: CronJob[];
}
