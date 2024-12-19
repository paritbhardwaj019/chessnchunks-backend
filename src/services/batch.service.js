const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const {
  validateHeadCoach,
  validateBatchCapacity,
  validateUserAcademy,
} = require('./batch.validators');
const { generateBatchCode, getWarningStatus } = require('./batch.utils');
const { getBatchFilter, getBatchById } = require('./batch.queries');

const createBatchHandler = async (data, loggedInUser) => {
  const {
    studentCapacity,
    description,
    academyId: providedAcademyId,
    warningCutoff,
    currentClass,
    startLevel,
    currentLevel,
    coaches,
    students,
    startDate,
    batchDay,
    startTime,
    endDate,
  } = data;

  const academyId =
    providedAcademyId ||
    (await validateUserAcademy(db, loggedInUser.id, loggedInUser.role));

  await validateHeadCoach(db, coaches);

  const batchCode = await generateBatchCode(db);

  const batch = await db.batch.create({
    data: {
      studentCapacity: Number(studentCapacity),
      description,
      batchCode,
      warningCutoff: Number(warningCutoff),
      currentClass,
      startLevel,
      currentLevel,
      batchDay,
      startTime: startTime,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      isActive: true,
      warningMailSent: false,
      createdByUser: {
        connect: {
          id: loggedInUser.id,
        },
      },
      modifiedByUser: {
        connect: {
          id: loggedInUser.id,
        },
      },
      academy: { connect: { id: academyId } },
      coaches: {
        connect:
          loggedInUser.role === 'COACH'
            ? [...coaches.map((id) => ({ id })), { id: loggedInUser.id }]
            : coaches.map((id) => ({ id })),
      },
      students: {
        connect: students.map((id) => ({ id })),
      },
    },
    include: {
      academy: true,
      coaches: true,
      students: true,
      createdByUser: {
        select: {
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      modifiedByUser: {
        select: {
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return batch;
};

const updateBatchHandler = async (id, data, loggedInUser) => {
  const batch = await getBatchById(db, id);

  if (data.studentCapacity !== undefined) {
    const newCapacity = Number(data.studentCapacity);
    const currentCapacity = batch.studentCapacity;

    if (newCapacity < currentCapacity) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Student capacity cannot be reduced below the current capacity of ${currentCapacity}`
      );
    }

    if (newCapacity < batch.students.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Student capacity cannot be less than current number of students (${batch.students.length})`
      );
    }
  }

  const updateData = {};

  Object.assign(updateData, {
    ...(data.studentCapacity !== undefined && {
      studentCapacity: Number(data.studentCapacity),
    }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.warningCutoff !== undefined && {
      warningCutoff: Number(data.warningCutoff),
    }),
    ...(data.currentClass !== undefined && { currentClass: data.currentClass }),
    ...(data.startDate !== undefined && {
      startDate: new Date(data.startDate),
    }),
    ...(data.startLevel !== undefined && { startLevel: data.startLevel }),
    ...(data.currentLevel !== undefined && { currentLevel: data.currentLevel }),
    ...(data.batchDay !== undefined && { batchDay: data.batchDay }),
    ...(data.startTime !== undefined && { startTime: data.startTime }),
    ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
    modifiedBy: loggedInUser.id,
  });

  if (data.coaches?.length) {
    await validateHeadCoach(db, data.coaches);
    Object.assign(updateData, {
      coaches: { set: data.coaches.map((id) => ({ id })) },
    });
  }

  if (data.students?.length) {
    validateBatchCapacity(
      batch.students.length,
      updateData.studentCapacity || batch.studentCapacity,
      data.students
    );
    Object.assign(updateData, {
      students: { set: data.students.map((id) => ({ id })) },
    });
  }

  const updatedBatch = await db.batch.update({
    where: { id },
    data: updateData,
    include: {
      academy: true,
      coaches: true,
      students: true,
      createdByUser: {
        select: {
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      modifiedByUser: {
        select: {
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  const warningStatus = getWarningStatus(
    updatedBatch.students.length,
    updateData.warningCutoff || batch.warningCutoff,
    updateData.studentCapacity || batch.studentCapacity
  );

  return { batch: updatedBatch, ...warningStatus };
};

const deleteBatchHandler = async (id) => {
  const batch = await getBatchById(db, id);

  if (batch.students.length > 0 || batch.coaches.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot delete batch with associated students or coaches'
    );
  }

  await db.batch.delete({ where: { id } });
  return { message: 'Batch deleted successfully' };
};

const fetchAllBatches = async (loggedInUser, { page, limit, query }) => {
  const filter = getBatchFilter(loggedInUser, query);

  return db.batch.findMany({
    where: filter,
    include: {
      students: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
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
          subRole: true,
        },
      },
      academy: {
        select: {
          id: true,
          name: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      modifiedByUser: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: page ? (page - 1) * limit : undefined,
    take: limit ? Number(limit) : undefined,
  });
};

const fetchAllBatchesForOptions = async (loggedInUser) => {
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
    where: batchFilter,
    select: {
      id: true,
      batchCode: true,
      _count: {
        select: { students: true },
      },
      startDate: true,
      students: {
        select: {
          profile: true,
          id: true,
          email: true,
        },
      },
      academy: {
        select: {
          name: true,
          id: true,
        },
      },
      batchDay: true,
      startTime: true,
      studentCapacity: true,
    },
  });

  return allBatches;
};

const fetchBatchById = async (loggedInUser, id) => {
  let batchFilter = {
    id: id,
  };

  if (loggedInUser.role === 'ADMIN') {
    batchFilter.academy = {
      admins: {
        some: {
          id: loggedInUser.id,
        },
      },
    };
  } else if (loggedInUser.role === 'COACH') {
    batchFilter.coaches = {
      some: {
        id: loggedInUser.id,
      },
    };
  }

  const batch = await db.batch.findFirst({
    where: batchFilter,
    select: {
      id: true,
      studentCapacity: true,
      batchCode: true,
      startLevel: true,
      currentLevel: true,
      description: true,
      warningCutoff: true,
      currentClass: true,
      isActive: true,
      batchDay: true,
      startTime: true,
      warningMailSent: true,
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
          role: {
            select: {
              name: true,
            },
          },
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
          role: {
            select: {
              name: true,
            },
          },
          subRole: true,
        },
      },
      academy: {
        select: {
          id: true,
          name: true,
        },
      },
      createdByUser: {
        select: {
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      modifiedByUser: {
        select: {
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      startDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!batch) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Batch not found or access denied!'
    );
  }

  return batch;
};

const addStudentToBatch = async (batchId, studentId) => {
  console.log(batchId, studentId);

  const batch = await db.batch.findUnique({
    where: { id: batchId },
    include: { students: true },
  });

  if (!batch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found!');
  }

  const student = await db.user.findFirst({
    where: {
      AND: [
        { id: studentId },
        {
          role: {
            name: 'STUDENT',
          },
        },
      ],
    },
  });

  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found!');
  }

  console.log(batch, student);

  const isAlreadyInBatch = batch.students.some((s) => s.id === studentId);
  if (isAlreadyInBatch) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Student is already in this batch.'
    );
  }

  const updatedBatch = await db.batch.update({
    where: { id: batchId },
    data: {
      students: {
        connect: { id: studentId },
      },
    },
    include: {
      students: true,
      academy: true,
      coaches: true,
    },
  });

  return updatedBatch;
};

const addCoachToBatch = async (batchId, coachId) => {
  // Check if batch exists
  const batch = await db.batch.findUnique({
    where: { id: batchId },
    include: { coaches: true },
  });

  if (!batch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found!');
  }

  // Check if coach exists
  const coach = await db.coach.findUnique({
    where: { id: coachId },
  });

  if (!coach) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Coach not found!');
  }

  // Check if coach is already in the batch
  const isAlreadyInBatch = batch.coaches.some((c) => c.id === coachId);
  if (isAlreadyInBatch) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Coach is already in this batch.'
    );
  }

  // Add coach to batch
  const updatedBatch = await db.batch.update({
    where: { id: batchId },
    data: {
      coaches: {
        connect: { id: coachId },
      },
    },
    include: {
      students: true,
      academy: true,
      coaches: true,
    },
  });

  return updatedBatch;
};

const getAllCoachesByBatchId = async (batchId) => {
  const batch = await db.batch.findUnique({
    where: { id: batchId },
    select: {
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
          role: {
            select: {
              name: true,
            },
          },
          subRole: true,
          createdAt: true,
        },
      },
    },
  });

  if (!batch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found!');
  }

  return batch.coaches;
};

const batchService = {
  createBatchHandler,
  updateBatchHandler,
  deleteBatchHandler,
  fetchAllBatches,
  fetchAllBatchesForOptions,
  fetchBatchById,
  addStudentToBatch,
  addCoachToBatch,
  getAllCoachesByBatchId,
};

module.exports = batchService;
