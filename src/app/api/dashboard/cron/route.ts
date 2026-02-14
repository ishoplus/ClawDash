import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CronJob {
  id: string;
  name?: string;
  schedule?: { expr?: string } | string;
  payload?: { message?: string };
  enabled?: boolean;
  sessionTarget?: string;
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
  };
  description?: string;
}

function getScheduleString(schedule: CronJob['schedule']): string {
  if (!schedule) return '無';
  if (typeof schedule === 'string') return schedule;
  return schedule.expr || '無';
}

interface CronData {
  jobs: CronJob[];
}

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

    let cronData: CronData;
    try {
      cronData = JSON.parse(stdout || '{}');
    } catch {
      cronData = { jobs: [] };
    }

    const cronJobs = cronData.jobs || [];
    
    // 過濾出指定 agent 的 cron jobs (不區分大小寫)
    const agentLower = agentId.toLowerCase();
    const agentJobs = cronJobs.filter((job: CronJob) => {
      const target = (job.sessionTarget || '').toLowerCase();
      return target === agentLower || target === `agent:${agentLower}`;
    });

    // 如果沒有找到指定 agent 的 jobs，返回全部
    const resultJobs = agentJobs.length > 0 ? agentJobs : cronJobs;

    // 格式化返回數據
    const formattedJobs = resultJobs.map((job: CronJob) => ({
      id: job.id,
      name: job.name || '未命名任務',
      schedule: getScheduleString(job.schedule),
      command: job.payload?.message?.substring(0, 50) + '...' || 'Agent Task',
      enabled: job.enabled,
      sessionTarget: job.sessionTarget,
      nextRun: job.state?.nextRunAtMs 
        ? new Date(job.state.nextRunAtMs).toLocaleString('zh-TW')
        : undefined,
      lastRun: job.state?.lastRunAtMs
        ? new Date(job.state.lastRunAtMs).toLocaleString('zh-TW')
        : undefined,
      description: job.description
    }));

    return NextResponse.json({ jobs: formattedJobs });
  } catch (error) {
    console.error('Error fetching cron jobs:', error);
    // 沒有模擬數據，直接返回錯誤
    return NextResponse.json({ 
      jobs: [],
      error: '無法獲取排程任務，請確認 OpenClaw CLI 是否可用'
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
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    if (!action || !['enable', 'disable'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Execute OpenClaw CLI to enable/disable cron job
    const { stdout, stderr } = await execAsync(
      `openclaw cron ${action} "${jobId}"`
    );

    if (stderr && !stderr.includes('warning')) {
      console.error(`Error ${action}ing cron job:`, stderr);
      return NextResponse.json({ error: `Failed to ${action} cron job` }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cron job ${action}d successfully` 
    });
  } catch (error) {
    console.error(`Error enabling/disabling cron job:`, error);
    return NextResponse.json({ error: 'Failed to update cron job' }, { status: 500 });
  }
}
