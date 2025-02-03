const DOMAIN_CONFIG = require('../config/domains');
const db = require('../database/prisma');

/**
 * Resolve academy domain based on input domain
 * @param {string} inputDomain - The input domain to resolve
 * @returns {Promise<string>} Resolved academy domain
 */
const resolveAcademyDomain = async (inputDomain) => {
  const domain = inputDomain.replace(
    new RegExp(`^(${DOMAIN_CONFIG.ALLOWED_PROTOCOLS.join('|')})`),
    ''
  );

  const isLocalhost =
    domain === `${DOMAIN_CONFIG.LOCAL.HOST}:${DOMAIN_CONFIG.LOCAL.PORT}`;

  if (isLocalhost) {
    const defaultAcademy = await db.academy.findFirst({
      where: { isDefault: true },
      select: { domain: true },
    });

    if (!defaultAcademy) {
      throw new Error('No default academy found');
    }

    return defaultAcademy.domain;
  }

  return `${DOMAIN_CONFIG.LOCAL.DEFAULT_PROTOCOL}${domain.split(':')[0]}.${DOMAIN_CONFIG.LOCAL.HOST}:${DOMAIN_CONFIG.LOCAL.ACADEMY_PORT}`;
};

module.exports = { resolveAcademyDomain };
