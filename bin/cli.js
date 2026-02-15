#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.join(__dirname, '..');

console.log('🚀 Starting ClawDash...');

const proc = spawn('npm', ['run', 'dev', '--', '--port', '3000'], {
  cwd: projectDir,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

proc.on('error', (err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

proc.on('close', (code) => {
  process.exit(code);
});

// Open browser
setTimeout(() => {
  const open = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  spawn(open, ['http://localhost:3000'], { stdio: 'ignore' });
}, 2000);
