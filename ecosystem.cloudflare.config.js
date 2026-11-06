/**
 * PM2 Ecosystem Configuration for Cloudflare Tunnel on Linux On-Premise Server
 * 
 * Usage:
 *   pm2 start ecosystem.cloudflare.config.js
 *   pm2 save
 *   pm2 startup
 */

const path = require('path');

module.exports = {
  apps: [
    // Option 1: Autonomous AI Gateway + Cloudflare Tunnel Supervisor
    // Handles server-gateway.js (Port 11435), 30s Keep-Alive, and Netlify auto-sync
    {
      name: "cloudflare-ai-tunnel",
      script: "tunnel-service.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      restart_delay: 4000,
      env: {
        NODE_ENV: "production",
        GATEWAY_PORT: 11435,
        NETLIFY_APP_URL: "https://aicoursea.netlify.app",
        // If using Cloudflare Zero Trust Named Tunnel Token, uncomment below:
        // CLOUDFLARE_TUNNEL_TOKEN: "your_cloudflare_tunnel_token_here"
      },
      error_file: path.join(__dirname, "aitunnel-err.log"),
      out_file: path.join(__dirname, "aitunnel.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      time: true
    }

    /*
    // Option 2: Direct Cloudflared Binary (If you only want raw cloudflared with token)
    // Uncomment this block and comment Option 1 if using Zero Trust Connector directly:
    {
      name: "cloudflared-daemon",
      script: "cloudflared",
      args: "tunnel run --token YOUR_CLOUDFLARE_TUNNEL_TOKEN",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      restart_delay: 5000,
      error_file: path.join(__dirname, "cloudflared-err.log"),
      out_file: path.join(__dirname, "cloudflared.log"),
      time: true
    }
    */
  ]
};

