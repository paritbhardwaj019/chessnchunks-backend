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
    return Array.from(cachedOrigins);
  } catch {
    return Array.from(cachedOrigins);
  }
}

function isOriginAllowed(origin) {
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
