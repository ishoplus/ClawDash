import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { parseLsOutput } from '../../../../lib/parseLsOutput';
import { validateWorkspacePath } from '../../../../lib/validatePath';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent') || 'code';
    const pathParam = searchParams.get('path') || '';

    // Use default workspace path if no path provided
    const userPath = pathParam || `/Users/showang/.openclaw/workspaces/${agentId}/`;
    
    // Validate the path to prevent directory traversal attacks
    // Use userPath so empty path gets default workspace validated
    const validation = validateWorkspacePath(userPath, agentId);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid path' },
        { status: 400 }
      );
    }

    // Use validated path or default workspace
    const validatedPath = validation.resolvedPath || userPath;

    // Use ls to get directory contents
    const { stdout } = await execAsync(`ls -la "${validatedPath}"`);
    const files = parseLsOutput(stdout);

    return NextResponse.json({ files }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching directory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch directory' },
      { status: 500 }
    );
  }
}
