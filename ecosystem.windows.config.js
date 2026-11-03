/**
 * PM2 Ecosystem Configuration for Windows Server
 * 
 * Usage:
 *   npm install -g pm2
 *   pm2 start ecosystem.windows.config.js
 *   pm2 save
 */

const path = require('path');

module.exports = {
  apps: [
    {
      name: "learn-overseas-app",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      error_file: path.join(__dirname, "logs", "windows-error.log"),
      out_file: path.join(__dirname, "logs", "windows-out.log"),
      time: true
    }
  ]
};
