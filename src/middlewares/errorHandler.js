const config = require('../config');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const { statusCode = 500, message } = err;

  console.log(err);

  const response = {
    statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  res.status(statusCode).json(response);
  next();
}

module.exports = errorHandler;
