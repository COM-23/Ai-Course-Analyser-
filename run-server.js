/**
 * Learn Overseas - Production Server Runner for PM2 (Windows & Linux)
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
const port = process.env.PORT || '3004';
const host = process.env.HOST || '0.0.0.0';

console.log(`[LearnOverseas] Launching Next.js production server on http://${host}:${port}...`);

let child;
if (fs.existsSync(nextBin)) {
  child = spawn(process.execPath, [nextBin, 'start', '-p', port, '-H', host], {
    cwd: __dirname,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
} else {
  console.log('[LearnOverseas] Fallback: using npx next start...');
  const isWin = process.platform === 'win32';
  child = spawn(isWin ? 'npx.cmd' : 'npx', ['next', 'start', '-p', port, '-H', host], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: isWin,
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
}

child.on('error', (err) => {
  console.error('[LearnOverseas] Failed to start server:', err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  console.log(`[LearnOverseas] Server process exited with code ${code} / signal ${signal}`);
  process.exit(code || 0);
});
