const db = require('../database/prisma');
const logger = require('../utils/logger');
const cron = require('node-cron');

let cachedOrigins = new Set(['http://localhost:3001', 'http://localhost:3000']);

async function updateOrigins() {
  try {
    const academies = await db.academy.findMany({
      where: { status: 'ACTIVE' },
      select: { domain: true },
    });

    const newOrigins = new Set([...cachedOrigins]);

    academies.forEach((academy) => {
      if (academy.domain) {
        newOrigins.add(academy.domain);
      }
    });

    cachedOrigins = newOrigins;
    logger.info(`Origins updated. Total origins: ${cachedOrigins.size}`);
    return Array.from(cachedOrigins);
  } catch {
    return Array.from(cachedOrigins);
  }
}

function isOriginAllowed(origin) {
  console.log('---CACHED_ORIGINS---', cachedOrigins);
  return cachedOrigins.has(origin);
}

function getAllowedOrigins() {
  return Array.from(cachedOrigins);
}

function addOrigin(origin) {
  cachedOrigins.add(origin);
  logger.info(`Origin added: ${origin}`);
}

cron.schedule('* * * * * *', async () => {
  logger.info('Running scheduled origin update...');
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
