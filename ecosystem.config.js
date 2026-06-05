const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  apps: [
    {
      name: 'gateway',
      script: 'dist/apps/gateway/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        PORT: process.env.PORT || 3000,
      },
    },
    {
      name: 'auth-service',
      script: 'dist/apps/auth-service/main.js',
      instances: 1,
      exec_mode: 'fork',
    },
    {
      name: 'user-service',
      script: 'dist/apps/user-service/main.js',
      instances: 1,
      exec_mode: 'fork',
    },
    {
      name: 'self-service',
      script: 'dist/apps/self-service/main.js',
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};
