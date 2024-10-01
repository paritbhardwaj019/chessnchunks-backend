const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const codeGenerator = require('otp-generator');

const createBatchHandler = async (data) => {
  const { studentCapacity, description, academyId } = data;

  const academy = await db.academy.findUnique({
    where: {
      id: academyId,
    },
  });

  if (!academy)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Academy not found!');

  const batchId = codeGenerator.generate(10, {
    upperCaseAlphabets: true,
    lowerCaseAlphabets: false,
    digits: true,
    specialChars: false,
  });

  const batch = await db.batch.create({
    data: {
      studentCapacity,
      description,
      academy: {
        connect: {
          id: academyId,
        },
      },
      batchId,
    },
    select: {
      id: true,
      batchId: true,
      studentCapacity: true,
    },
  });

  const updatedAcademy = await db.academy.update({
    where: {
      id: academyId,
    },
    data: {
      batches: {
        connect: [{ id: batch.id }],
      },
    },
    select: {
      id: true,
      name: true,
      batches: true,
    },
  });

  return {
    batch,
    updatedAcademy,
  };
};

const updateBatchHandler = async (id, data) => {
  return {};
};

const deleteBatchHandler = async (id) => {
  return {};
};

const fetchAllBatchesByAcademyId = async (academyId) => {
  const allBatches = await db.batch.findMany({
    where: {
      academyId: academyId,
    },
    select: {
      batchId: true,
      id: true,
      studentCapacity: true,
      students: {
        select: {
          email: true,
          id: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          role: true,
        },
      },
      coaches: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          role: true,
          subRole: true,
        },
      },
    },
  });

  return allBatches;
};

const batchService = {
  createBatchHandler,
  updateBatchHandler,
  deleteBatchHandler,
  fetchAllBatchesByAcademyId,
};

module.exports = batchService;
