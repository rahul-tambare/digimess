module.exports = {
  apps: [
    {
      name: 'digimess-api',
      script: 'backend/server.js',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
