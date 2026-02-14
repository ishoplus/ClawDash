interface AgentStatusProps {
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
}

export function AgentStatus({ agent }: AgentStatusProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-2xl">💻</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {agent.name}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {agent.role}
          </p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">模型:</span>
          <span className="font-mono text-gray-900 dark:text-white">
            {agent.model}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">会话:</span>
          <span className="font-mono text-gray-900 dark:text-white">
            {agent.sessionKey}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">频道:</span>
          <span className="text-gray-900 dark:text-white">
            {agent.channel} ({agent.displayName})
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Context:</span>
          <span className="font-mono text-gray-900 dark:text-white">
            {agent.context}
          </span>
        </div>

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-gray-600 dark:text-gray-400 mb-2">Token 使用:</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Input</span>
              <span className="font-mono text-blue-600">{agent.tokenUsage.input}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Output</span>
              <span className="font-mono text-green-600">{agent.tokenUsage.output}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Total</span>
              <span className="font-mono text-gray-900 dark:text-white font-bold">
                {agent.tokenUsage.total}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
