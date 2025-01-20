const httpStatus = require('http-status');

const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const formatNumberWithPrefix = require('../utils/formatNumberWithPrefix');

/**
 * Generates a unique system code for a given module
 * @param {string} module - Module name (e.g., 'BATCH', 'TASK', etc.)
 * @returns {Promise<string>} Generated code with prefix
 */

const generateSystemCode = async (module) => {
  const systemCode = await db.systemCode.findFirst({
    where: {
      module,
      isActive: true,
    },
  });

  if (!systemCode) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      `${module} system code configuration not found`
    );
  }

  const newNumber = systemCode.lastNumber + 1;

  await db.systemCode.update({
    where: { id: systemCode.id },
    data: { lastNumber: newNumber },
  });

  return formatNumberWithPrefix(systemCode.prefix, newNumber);
};

module.exports = generateSystemCode;
