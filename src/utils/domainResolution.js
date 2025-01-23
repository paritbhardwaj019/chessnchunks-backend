const db = require('../database/prisma');

/**
 * Resolve academy domain based on input domain
 * @param {string} inputDomain - The input domain to resolve
 * @returns {Promise<string>} Resolved academy domain
 */
const resolveAcademyDomain = async (inputDomain) => {
  const domain = inputDomain.replace(/^https?:\/\//, '');

  if (domain === 'localhost:3000') {
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

  return `http://${domain.split(':')[0]}.localhost:3001`;
};

module.exports = { resolveAcademyDomain };
