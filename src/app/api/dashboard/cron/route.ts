import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
