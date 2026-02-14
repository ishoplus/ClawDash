import type { WorkspaceFile } from './types';

export type { WorkspaceFile } from './types';

/**
 * Parse ls -la output into structured WorkspaceFile array
 */
export function parseLsOutput(output: string): WorkspaceFile[] {
  const files: WorkspaceFile[] = [];
  const lines = output.trim().split('\n');

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);

    // Skip header, total line, . and .. directories
    if (parts[0] === 'total' || parts.length < 9) continue;
    if (parts[8] === '.' || parts[8] === '..') continue;

    const permissions = parts[0];
    const size = parseInt(parts[4]) || 0;
    const name = parts[8];
    const type = permissions.startsWith('d') ? 'dir' : 'file';
    const dateParts = parts.slice(5, 9);
    const modified = dateParts.join(' ');

    files.push({
      name,
      type,
      size,
      modified,
    });
  }

  return files;
}
