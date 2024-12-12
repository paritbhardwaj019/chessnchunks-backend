const db = require('../database/prisma');
const logger = require('../utils/logger');
const cron = require('node-cron');

// Initialize with default allowed origins (no trailing slashes)
let cachedOrigins = new Set(['http://localhost:3001', 'http://localhost:3000']);

async function updateOrigins() {
  try {
    const academies = await db.academy.findMany({
      where: { status: 'ACTIVE' },
      select: { domain: true },
    });

    // Start with default origins to prevent stale entries
    const newOrigins = new Set([
      'http://localhost:3001',
      'http://localhost:3000',
    ]);

    academies.forEach((academy) => {
      if (academy.domain) {
        try {
          const originalUrl = new URL(academy.domain);
          // Use URL.origin to avoid trailing slashes
          newOrigins.add(originalUrl.origin);

          // Determine the alternative port
          let alternativePort;
          if (originalUrl.port === '3001') {
            alternativePort = '3000';
          } else if (originalUrl.port === '3000') {
            alternativePort = '3001';
          } else {
            // Default to adding port 3000 if original port is different
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
    logger.info(
      `Origins updated. Total allowed origins: ${cachedOrigins.size}`
    );
    logger.info(`Allowed origins: ${Array.from(cachedOrigins).join(', ')}`);
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
  // Ensure no trailing slash when adding manually
  try {
    const url = new URL(origin);
    cachedOrigins.add(url.origin);
    logger.info(`Origin added: ${url.origin}`);
  } catch (error) {
    logger.error(`Failed to add origin: ${origin} - ${error.message}`);
  }
}

// Adjust cron schedule to run every minute instead of every second
cron.schedule('* * * * *', async () => {
  await updateOrigins();
});

// Initial origins update
updateOrigins().then(() => {
  logger.info('Initial origins update completed');
});

module.exports = {
  updateOrigins,
  isOriginAllowed,
  getAllowedOrigins,
  addOrigin,
};
