const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const getDailyLogDir = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return path.join(__dirname, '../../', 'logs', `${year}-${month}-${day}`);
};

const dailyLogDir = getDailyLogDir();
if (!fs.existsSync(dailyLogDir)) {
  fs.mkdirSync(dailyLogDir, { recursive: true });
}

const errorLogFilePath = path.join(dailyLogDir, 'error.log');
const successLogFilePath = path.join(dailyLogDir, 'success.log');

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

module.exports = logger;
