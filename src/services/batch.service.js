const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const formatNumberWithPrefix = require('../utils/formatNumberWithPrefix');

const createBatchHandler = async (data) => {
  const {
    studentCapacity,
    description,
    academyId,
    warningCutoff,
    currentClass,
  } = data;

  const newStartDate = new Date(data.startDate);
  const newEndDate = new Date(data.endDate);

  const academy = await db.academy.findUnique({
    where: {
      id: academyId,
    },
  });

  if (!academy) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Academy not found!');
  }

  const allBatchesCount = await db.batch.count({
    where: {
      academy: {
        id: academyId,
      },
    },
  });

  const batchCode = formatNumberWithPrefix('B', allBatchesCount);

  const batch = await db.batch.create({
    data: {
      studentCapacity: Number(studentCapacity),
      description,
      academy: {
        connect: {
          id: academyId,
        },
      },
      batchCode,
      warningCutoff: Number(warningCutoff),
      currentClass,
      startLevel: '1',
      currentLevel: '100',
      startDate: newStartDate,
      endDate: newEndDate,
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

const fetchAllBatches = async (loggedInUser) => {
  let batchFilter = {};

  if (loggedInUser.role === 'ADMIN') {
    batchFilter = {
      academy: {
        admins: {
          some: {
            id: loggedInUser.id,
          },
        },
      },
    };
  } else if (loggedInUser.role === 'COACH') {
    batchFilter = {
      coaches: {
        some: {
          id: loggedInUser.id,
        },
      },
    };
  }

  const allBatches = await db.batch.findMany({
    select: {
      id: true,
      studentCapacity: true,
      batchCode: true,
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
  fetchAllBatches,
};

module.exports = batchService;
