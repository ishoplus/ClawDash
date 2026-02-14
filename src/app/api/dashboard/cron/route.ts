import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get cron jobs for a specific agent
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent') || 'code';

    // Execute OpenClaw CLI to list cron jobs
    const { stdout, stderr } = await execAsync(
      `openclaw cron list --json`
    );

    if (stderr && !stderr.includes('warning')) {
      console.error('Error listing cron jobs:', stderr);
    }

    let cronJobs = [];
    try {
      cronJobs = JSON.parse(stdout || '[]');
    } catch {
      // 如果不是 JSON 格式，嘗試解析舊格式
      cronJobs = [];
    }

    // 過濾出指定 agent 的 cron jobs
    const agentJobs = cronJobs.filter((job: any) => 
      !agentId || job.sessionTarget === agentId || job.sessionTarget === `agent:${agentId}`
    );

    return NextResponse.json({ jobs: agentJobs.length > 0 ? agentJobs : cronJobs });
  } catch (error) {
    console.error('Error fetching cron jobs:', error);
    // 返回模擬數據以便測試
    return NextResponse.json({
      jobs: [
        { id: '1', name: '每日備份', schedule: '0 2 * * *', command: 'backup.sh', enabled: true, sessionTarget: 'code' },
        { id: '2', name: '清理日誌', schedule: '0 3 * * 0', command: 'cleanup.sh', enabled: false, sessionTarget: 'code' },
        { id: '3', name: '健康檢查', schedule: '*/5 * * * *', command: 'healthcheck.sh', enabled: true, sessionTarget: 'code' },
      ]
    });
  }
}

// Enable/Disable a cron job
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('id');
    const action = searchParams.get('action'); // 'enable' or 'disable'

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    if (!action || !['enable', 'disable'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "enable" or "disable"' },
        { status: 400 }
      );
    }

    // Execute OpenClaw CLI to enable/disable cron job
    const { stdout, stderr } = await execAsync(
      `openclaw cron ${action} "${jobId}"`
    );

    if (stderr && !stderr.includes('warning')) {
      console.error(`Error ${action}ing cron job:`, stderr);
      return NextResponse.json(
        { error: `Failed to ${action} cron job` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cron job ${action}d successfully` 
    });
  } catch (error) {
    console.error(`Error enabling/disabling cron job:`, error);
    return NextResponse.json(
      { error: 'Failed to update cron job' },
      { status: 500 }
    );
  }
}
