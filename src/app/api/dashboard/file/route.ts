import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB limit for preview

function validateWorkspacePath(
  userPath: string,
  agentId: string,
  baseWorkspace: string = '/Users/showang/.openclaw/workspaces/'
): { valid: boolean; resolvedPath?: string; error?: string } {
  const safeAgentId = agentId.replace(/[^a-zA-Z0-9-_]/g, '');
  const expectedBase = path.normalize(path.join(baseWorkspace, safeAgentId));

  // If user provides a path starting with '/', treat it as relative to workspace
  let relativePath: string;
  if (userPath.startsWith('/')) {
    // Remove leading slash to get relative path
    relativePath = userPath.slice(1);
  } else {
    relativePath = userPath;
  }

  // Check for path traversal
  const pathParts = relativePath.split('/');
  if (pathParts.some(part => part === '..' || part === '.')) {
    return { valid: false, error: 'Path traversal characters not allowed' };
  }

  // Resolve the full path
  const resolvedPath = path.join(expectedBase, relativePath);

  // Ensure the resolved path is within the workspace
  if (!resolvedPath.startsWith(expectedBase)) {
    return { valid: false, error: 'Access outside workspace not permitted' };
  }

  return { valid: true, resolvedPath };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent') || 'code';
    const pathParam = searchParams.get('path') || '';

    // Validate path
    const validation = validateWorkspacePath(pathParam, agentId);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid path' },
        { status: 400 }
      );
    }

    const validatedPath = validation.resolvedPath!;

    // Check if file exists
    if (!fs.existsSync(validatedPath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const stats = fs.statSync(validatedPath);
    
    // Don't preview directories
    if (stats.isDirectory()) {
      return NextResponse.json(
        { error: 'Cannot preview directory' },
        { status: 400 }
      );
    }

    // Size check (1MB limit)
    if (stats.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large to preview (max 1MB)' },
        { status: 400 }
      );
    }

    // Read file content
    const content = fs.readFileSync(validatedPath, 'utf-8');
    const fileName = pathParam.split('/').pop() || 'unknown';

    return NextResponse.json({
      name: fileName,
      content: content.slice(0, 50000), // Limit to 50KB for display
      size: stats.size,
      modified: stats.mtime.toLocaleString('zh-TW')
    });
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}
