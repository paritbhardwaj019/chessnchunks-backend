const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { initializeSocket } = require('./socket');

const server = http.createServer(app);

initializeSocket(server);

server.listen(config.port, '0.0.0.0', () => {
  logger.info(`Server is running on port ${config.port}`);
});

server.on('error', (error) => {
  logger.error('Server error:', error);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
});

module.exports = { server };
