module.exports = {
  apps: [
    {
      name: "s4r-backend",
      cwd: "./backend",
      script: "pnpm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      restart_delay: 5000,
      max_restarts: 10,
    },
    {
      name: "s4r-worker",
      cwd: "./backend",
      script: "pnpm",
      args: "run worker",
      env: {
        NODE_ENV: "production",
      },
      restart_delay: 5000,
      max_restarts: 10,
    },
    {
      name: "s4r-frontend",
      cwd: "./frontend",
      script: "pnpm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
};
