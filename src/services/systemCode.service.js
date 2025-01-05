const httpStatus = require('http-status');
const ApiError = require('../utils/apiError');
const db = require('../database/prisma');

const createSystemCode = async (data) => {
  const { module, prefix, description } = data;

  const existingCode = await db.systemCode.findFirst({
    where: {
      module,
      prefix,
    },
  });

  if (existingCode) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `System code already exists for module ${module} with prefix ${prefix}`
    );
  }

  return db.systemCode.create({
    data: {
      module,
      prefix,
      description,
    },
  });
};

const updateSystemCode = async (id, data) => {
  const { isActive } = data;

  const systemCode = await db.systemCode.findUnique({
    where: { id },
  });

  if (!systemCode) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'System code configuration not found'
    );
  }

  return db.systemCode.update({
    where: { id },
    data: { isActive },
  });
};

const getAllSystemCodes = async () => {
  return db.systemCode.findMany({
    orderBy: { module: 'asc' },
  });
};

module.exports = {
  createSystemCode,
  updateSystemCode,
  getAllSystemCodes,
};
