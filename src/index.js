const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

const httpServer = http.createServer(app);

httpServer.listen(config.port, () => {
  logger.info('Server is running on ' + config.port);
});
