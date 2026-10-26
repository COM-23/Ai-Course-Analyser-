module.exports = {
  apps: [
    {
      name: "LearnOverseas",
      script: "run-server.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3004,
        HOST: "0.0.0.0"
      }
    },
    {
      name: "LearnOverseasAI",
      script: "tunnel-service.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        GATEWAY_PORT: 11435
      }
    }
  ]
};
