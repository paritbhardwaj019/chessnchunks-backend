const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const formatNumberWithPrefix = require('../utils/formatNumberWithPrefix');

const createBatchHandler = async (data, loggedInUser) => {
  let {
    studentCapacity,
    description,
    academyId,
    warningCutoff,
    currentClass,
    startLevel,
    currentLevel,
    coaches,
    students,
    startDate,
  } = data;

  if (loggedInUser.role === 'COACH' || loggedInUser.role === 'ADMIN') {
    const userWithAcademies = await db.user.findUnique({
      where: { id: loggedInUser.id },
      include: {
        adminOfAcademies: true,
        coachOfBatches: {
          include: {
            academy: true,
          },
        },
      },
    });

    const academyIds = [
      ...new Set(
        loggedInUser.role === 'COACH'
          ? userWithAcademies.coachOfBatches.map((batch) => batch.academyId)
          : userWithAcademies.adminOfAcademies.map((academy) => academy.id)
      ),
    ];

    if (academyIds.length === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `${loggedInUser.role} is not associated with any academy.`
      );
    }

    if (academyIds.length > 1) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `${loggedInUser.role} is associated with multiple academies. Please specify the academy.`
      );
    }

    academyId = academyIds[0];
  }

  const newStartDate = new Date(startDate);

  const academy = await db.academy.findUnique({
    where: {
      id: academyId,
    },
  });

  if (!academy) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Academy not found!');
  }

  const allBatchesCount = await db.batch.count();
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
      startLevel: startLevel,
      currentLevel: currentLevel,
      startDate: newStartDate,
      coaches: {
        connect:
          loggedInUser.role === 'COACH'
            ? [
                ...coaches.map((coachId) => ({ id: coachId })),
                { id: loggedInUser.id },
              ]
            : coaches.map((coachId) => ({ id: coachId })),
      },
      students: {
        connect: students.map((studentId) => ({ id: studentId })),
      },
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
  // Fetch the existing batch from the database
  const batch = await db.batch.findUnique({
    where: { id },
    include: { students: true }, // Ensure students are included for count
  });

  if (!batch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found!');
  }

  // Destructure the incoming data
  const {
    studentCapacity,
    description,
    warningCutoff,
    currentClass,
    startDate,
    startLevel,
    currentLevel,
    coaches,
    students,
  } = data;

  // Determine the new student capacity
  const newCapacity =
    studentCapacity !== undefined
      ? Number(studentCapacity)
      : batch.studentCapacity;

  // Determine the new warning cutoff
  const newWarningCutoff =
    warningCutoff !== undefined ? Number(warningCutoff) : batch.warningCutoff;

  // If students are being updated, validate the new number of students against the capacity
  if (students !== undefined) {
    if (students.length > newCapacity) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Number of students (${students.length}) exceeds the maximum capacity (${newCapacity}).`
      );
    }
  }

  // Prepare the update data object
  const updateData = {};

  if (studentCapacity !== undefined) {
    updateData.studentCapacity = newCapacity;
  }
  if (description !== undefined) {
    updateData.description = description;
  }
  if (warningCutoff !== undefined) {
    updateData.warningCutoff = newWarningCutoff;
  }
  if (currentClass !== undefined) {
    updateData.currentClass = currentClass;
  }
  if (startDate !== undefined) {
    updateData.startDate = new Date(startDate);
  }
  if (startLevel !== undefined) {
    updateData.startLevel = startLevel;
  }
  if (currentLevel !== undefined) {
    updateData.currentLevel = currentLevel;
  }

  if (coaches !== undefined) {
    updateData.coaches = {
      set: coaches.map((coachId) => ({ id: coachId })),
    };
  }

  if (students !== undefined) {
    updateData.students = {
      set: students.map((studentId) => ({ id: studentId })),
    };
  }

  // Perform the update operation
  const updatedBatch = await db.batch.update({
    where: { id },
    data: updateData,
    include: { academy: true },
  });

  // Determine the current number of students
  const currentStudentCount =
    students !== undefined ? students.length : batch.students.length;

  // Calculate how many more students can be added before reaching capacity
  const remainingCapacity = newCapacity - currentStudentCount;

  // Initialize warning flags
  let warningCutoffExceeded = false;
  let warningMessage = '';

  if (currentStudentCount > newWarningCutoff) {
    warningCutoffExceeded = true;
    warningMessage = `Warning: You have exceeded the warning cutoff. You can only add ${remainingCapacity} more student(s) before reaching maximum capacity (${newCapacity}).`;
  }

  // Return the updated batch along with warning information if applicable
  return {
    batch: updatedBatch,
    warningCutoffExceeded,
    warningMessage,
  };
};

const deleteBatchHandler = async (id) => {
  const batch = await db.batch.findUnique({
    where: {
      id: id,
    },
    include: {
      students: true,
      coaches: true,
    },
  });

  if (!batch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found!');
  }

  if (batch.students.length > 0 || batch.coaches.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot delete batch with associated students or coaches'
    );
  }

  await db.batch.delete({
    where: {
      id: id,
    },
  });

  return { message: 'Batch deleted successfully' };
};

const fetchAllBatches = async (loggedInUser, { page, limit, query }) => {
  let batchFilter = {};

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

  if (query) {
    batchFilter.batchCode = {
      contains: query,
    };
  }

  const allBatches = await db.batch.findMany({
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
      academy: {
        select: {
          name: true,
          id: true,
        },
      },
      startDate: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return allBatches;
};

const fetchAllBatchesForOptions = async (loggedInUser) => {
  let batchFilter = {};

  console.log('LOGGED IN USER', loggedInUser);

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
      academy: {
        select: {
          id: true,
          name: true,
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
  const batch = await db.batch.findUnique({
    where: { id: batchId },
    include: { students: true },
  });

  if (!batch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found!');
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found!');
  }

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
          role: true,
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
  addStudentToBatch, // New
  addCoachToBatch, // New
  getAllCoachesByBatchId, // New
};

module.exports = batchService;
