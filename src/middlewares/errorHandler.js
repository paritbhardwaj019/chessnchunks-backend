const config = require('../config');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

function errorHandler(err, _, res, _) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message =
    err instanceof ApiError ? err.message : 'Internal Server Error';

  const response = {
    statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
