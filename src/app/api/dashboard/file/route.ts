import { NextResponse } from 'next/server';
import { readFileSync, statSync } from 'fs';
import { validateWorkspacePath } from '../../../../lib/validatePath';

// GET: Read file content for preview
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent') || 'code';
    const fileName = searchParams.get('path');

    if (!fileName) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Validate the path to prevent path traversal attacks
    const validation = validateWorkspacePath(fileName, agentId);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const filePath = validation.resolvedPath!;

    // Read file content
    const content = readFileSync(filePath, 'utf-8');

    return NextResponse.json({ content }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}

// DOWNLOAD: Download file as attachment
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent') || 'code';
    const fileName = searchParams.get('path');
    const action = searchParams.get('action');

    if (action !== 'download') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    if (!fileName) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Validate the path
    const validation = validateWorkspacePath(fileName, agentId);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const filePath = validation.resolvedPath!;

    // Get file stats
    const stats = statSync(filePath);
    
    // For large files, return error
    if (stats.size > 50 * 1024 * 1024) { // 50MB limit
      return NextResponse.json(
        { error: 'File too large (max 50MB)' },
        { status: 400 }
      );
    }

    // Read file content as buffer
    const content = readFileSync(filePath);
    const fileNameOnly = fileName.split('/').pop() || 'file';

    return new NextResponse(content, {
      headers: {
        'Content-Disposition': `attachment; filename="${fileNameOnly}"`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': stats.size.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
