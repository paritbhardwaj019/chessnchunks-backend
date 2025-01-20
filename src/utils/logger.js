const winston = require('winston');
const path = require('path');
const config = require('../config');

const errorLogFilePath = path.join(__dirname, '../../', 'logs', 'error.log');
const successLogFilePath = path.join(
  __dirname,
  '../../',
  'logs',
  'success.log'
);

const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    config.env === 'development'
      ? winston.format.colorize()
      : winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      ({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),

    new winston.transports.File({
      filename: errorLogFilePath,
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
      ),
    }),

    new winston.transports.File({
      filename: successLogFilePath,
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
      ),
    }),
  ],
});

const fs = require('fs');
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

module.exports = logger;
