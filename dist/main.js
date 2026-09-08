// Re-export from the actual build location
// Railway's default CMD: node /app/dist/main.js
// The actual NestJS build is at /app/apps/api/dist/main.js
module.exports = require('../apps/api/dist/main.js');
