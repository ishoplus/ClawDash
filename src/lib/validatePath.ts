import { join, normalize, sep } from 'path';

/**
 * Validate that the given path is within the allowed workspace directory.
 * Prevents path traversal attacks (e.g., ../../../etc/passwd)
 */
export function validateWorkspacePath(
  userPath: string,
  agentId: string,
  baseWorkspace: string = '/Users/showang/.openclaw/workspaces/'
): { valid: boolean; resolvedPath?: string; error?: string } {
  // Ensure agentId is safe ( alphanumeric and hyphens only )
  const safeAgentId = agentId.replace(/[^a-zA-Z0-9-_]/g, '');
  
  // Build the expected base path
  const expectedBase = normalize(join(baseWorkspace, safeAgentId));
  
  // Normalize the user-provided path
  const normalizedPath = normalize(userPath);
  
  // Handle absolute paths - treat as relative to workspace
  if (normalizedPath.startsWith('/')) {
    // If it starts with workspace base, extract relative portion
    if (normalizedPath.startsWith(expectedBase)) {
      const relativePath = normalizedPath.slice(expectedBase.length);
      const trimmedRelative = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
      
      const pathParts = trimmedRelative.split(sep);
      if (pathParts.some(part => part === '..' || part === '.')) {
        return { 
          valid: false, 
          error: 'Path traversal characters (.. or .) are not allowed.' 
        };
      }
      
      const resolvedPath = join(expectedBase, trimmedRelative);
      return { valid: true, resolvedPath };
    }
    
    // Path starts with / but not in workspace - treat as relative
    // Remove leading slash and process as relative path
    const trimmedRelative = normalizedPath.slice(1);
    
    const pathParts = trimmedRelative.split(sep);
    if (pathParts.some(part => part === '..' || part === '.')) {
      return { 
        valid: false, 
        error: 'Path traversal characters (.. or .) are not allowed.' 
      };
    }
    
    const resolvedPath = join(expectedBase, trimmedRelative);
    
    // Verify it's still within workspace
    if (!resolvedPath.startsWith(expectedBase)) {
      return { 
        valid: false, 
        error: 'Access outside workspace is not permitted.' 
      };
    }
    
    return { valid: true, resolvedPath };
  }
  
  // Check for path traversal attempts (going up directories)
  const pathParts = normalizedPath.split(sep);
  if (pathParts.some(part => part === '..' || part === '.')) {
    return { 
      valid: false, 
      error: 'Path traversal characters (.. or .) are not allowed.' 
    };
  }
  
  // Resolve the full path
  const resolvedPath = join(expectedBase, normalizedPath);
  
  // Ensure the resolved path is within the workspace
  if (!resolvedPath.startsWith(expectedBase)) {
    return { 
      valid: false, 
      error: 'Access outside workspace is not permitted.' 
    };
  }
  
  return { valid: true, resolvedPath };
}

/**
 * Sanitize filename to remove dangerous characters
 */
export function sanitizeFileName(fileName: string): string {
  // Remove any path separators and traversal characters
  const sanitized = fileName
    .split(/[\/\\]/)
    .pop() // Get only the filename part
    ?.replace(/[^a-zA-Z0-9._-]/g, '') // Keep only safe characters
    || '';
    
  return sanitized;
}
