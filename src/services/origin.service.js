const cron = require('node-cron');
const db = require('../database/prisma');
const logger = require('../utils/logger');
const config = require('../config');

let cachedOrigins = new Set([config.chessinChunksUrl, config.frontendUrl]);

async function updateOrigins() {
  try {
    const academies = await db.academy.findMany({
      where: { status: 'ACTIVE' },
      select: { domain: true },
    });

    const newOrigins = new Set([config.chessinChunksUrl, config.frontendUrl]);

    academies.forEach((academy) => {
      if (academy.domain) {
        try {
          const originalUrl = new URL(academy.domain);
          newOrigins.add(originalUrl.origin);

          let alternativePort;
          if (originalUrl.port === '3001') {
            alternativePort = '3000';
          } else if (originalUrl.port === '3000') {
            alternativePort = '3001';
          } else {
            alternativePort = '3000';
          }

          const alternativeUrl = new URL(originalUrl.origin);
          alternativeUrl.port = alternativePort;
          newOrigins.add(alternativeUrl.origin);
        } catch (error) {
          logger.error(
            `Invalid domain URL: ${academy.domain} - ${error.message}`
          );
        }
      }
    });

    cachedOrigins = newOrigins;
    return Array.from(cachedOrigins);
  } catch (error) {
    logger.error(`Failed to update origins: ${error.message}`);
    return Array.from(cachedOrigins);
  }
}

function isOriginAllowed(origin) {
  const allowed = cachedOrigins.has(origin);
  if (!allowed) {
    logger.warn(`Origin not allowed: ${origin}`);
  }
  return allowed;
}

function getAllowedOrigins() {
  return Array.from(cachedOrigins);
}

function addOrigin(origin) {
  try {
    const url = new URL(origin);
    cachedOrigins.add(url.origin);
    logger.info(`Origin added: ${url.origin}`);
  } catch (error) {
    logger.error(`Failed to add origin: ${origin} - ${error.message}`);
  }
}

cron.schedule('* * * * *', async () => {
  await updateOrigins();
});

updateOrigins().then(() => {
  logger.info('Initial origins update completed');
});

module.exports = {
  updateOrigins,
  isOriginAllowed,
  getAllowedOrigins,
  addOrigin,
};
