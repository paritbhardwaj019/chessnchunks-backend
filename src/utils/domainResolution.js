const db = require('../database/prisma');

/**
 * Resolve academy domain based on input domain
 * @param {string} inputDomain - The input domain to resolve
 * @returns {Promise<string>} Resolved academy domain
 */

const resolveAcademyDomain = async (inputDomain) => {
  let domain = inputDomain.replace(/^https?:\/\//, '');

  const parts = domain.split(':');

  const localhostMatch = parts[0].match(/^(.+)\.localhost$/);

  if (localhostMatch || parts[0] === 'localhost') {
    const defaultAcademy = await db.academy.findFirst({
      where: {
        isDefault: true,
      },
      select: {
        domain: true,
      },
    });

    if (!defaultAcademy) {
      throw new Error('No default academy found');
    }

    return defaultAcademy.domain;
  }

  return inputDomain;
};

module.exports = { resolveAcademyDomain };
