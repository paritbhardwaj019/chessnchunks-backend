const httpStatus = require('http-status');
const db = require('../../../database/prisma');
const ApiError = require('../../../utils/apiError');
const formatNumberWithPrefix = require('../../../utils/formatNumberWithPrefix');

const generateBatchCode = async () => {
  const systemCode = await db.systemCode.findFirst({
    where: {
      module: 'BATCH',
      isActive: true,
    },
  });

  if (!systemCode) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Batch system code configuration not found'
    );
  }

  const newNumber = systemCode.lastNumber + 1;

  await db.systemCode.update({
    where: { id: systemCode.id },
    data: { lastNumber: newNumber },
  });

  return formatNumberWithPrefix(systemCode.prefix, newNumber);
};

const getWarningStatus = (currentStudentCount, warningCutoff, capacity) => {
  const remainingCapacity = capacity - currentStudentCount;
  const warningCutoffExceeded = currentStudentCount > warningCutoff;

  return {
    warningCutoffExceeded,
    warningMessage: warningCutoffExceeded
      ? `Warning: You have exceeded the warning cutoff. You can only add ${remainingCapacity} more student(s) before reaching maximum capacity (${capacity}).`
      : '',
  };
};

const batchUtils = { generateBatchCode, getWarningStatus };

module.exports = batchUtils;
