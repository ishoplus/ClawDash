import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Terminate a session by key
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionKey = searchParams.get('key');

    if (!sessionKey) {
      return NextResponse.json(
        { error: 'Session key is required' },
        { status: 400 }
      );
    }

    // Execute OpenClaw CLI to terminate session
    const { stdout, stderr } = await execAsync(
      `openclaw sessions kill "${sessionKey}"`
    );

    if (stderr && !stderr.includes('warning')) {
      console.error('Error terminating session:', stderr);
      return NextResponse.json(
        { error: 'Failed to terminate session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Session terminated successfully' 
    });
  } catch (error) {
    console.error('Error terminating session:', error);
    return NextResponse.json(
      { error: 'Failed to terminate session' },
      { status: 500 }
    );
  }
}
