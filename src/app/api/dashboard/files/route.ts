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

    // Default workspace path for this agent
    const defaultPath = `/Users/showang/.openclaw/workspaces/${agentId}/`;

    // If no path or root path, use default
    let validatedPath: string;
    if (!pathParam || pathParam === '/' || pathParam === '') {
      validatedPath = defaultPath;
    } else {
      // Validate the path to prevent directory traversal attacks
      const validation = validateWorkspacePath(pathParam, agentId);
      
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || 'Invalid path' },
          { status: 400 }
        );
      }
      validatedPath = validation.resolvedPath || defaultPath;
    }

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
