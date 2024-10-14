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
    startLevel,
    currentLevel,
    coaches = [],
    students = [],
  } = data;

  const newStartDate = new Date(data.startDate);

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

  // Create the batch
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
        connect: coaches.map((coachId) => ({ id: coachId })),
      },
      students: {
        connect: students.map((studentId) => ({ id: studentId })),
      },
    },
    include: {
      students: true, // Include students for friendship creation
    },
  });

  // Create batch friendships among students
  if (batch.students.length > 1) {
    // Generate pairs of students
    const friendData = [];
    const studentIds = batch.students.map((student) => student.id);

    for (let i = 0; i < studentIds.length; i++) {
      for (let j = i + 1; j < studentIds.length; j++) {
        friendData.push(
          { userId: studentIds[i], friendId: studentIds[j], type: 'BATCH' },
          { userId: studentIds[j], friendId: studentIds[i], type: 'BATCH' }
        );
      }
    }

    // Create batch friendships
    await db.friend.createMany({
      data: friendData,
      skipDuplicates: true, // Avoid errors if the friendship already exists
    });
  }

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
  const batch = await db.batch.findUnique({
    where: {
      id: id,
    },
    include: {
      students: true, // Include current students
    },
  });

  if (!batch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found!');
  }

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

  const updateData = {};

  if (studentCapacity !== undefined)
    updateData.studentCapacity = Number(studentCapacity);
  if (description !== undefined) updateData.description = description;
  if (warningCutoff !== undefined)
    updateData.warningCutoff = Number(warningCutoff);
  if (currentClass !== undefined) updateData.currentClass = currentClass;
  if (startDate !== undefined) updateData.startDate = new Date(startDate);
  if (startLevel !== undefined) updateData.startLevel = startLevel;
  if (currentLevel !== undefined) updateData.currentLevel = currentLevel;

  // Handle coaches update
  if (coaches !== undefined) {
    updateData.coaches = {
      set: coaches.map((coachId) => ({ id: coachId })),
    };
  }

  // Handle students update
  if (students !== undefined) {
    // Get the current and new students
    const currentStudentIds = batch.students.map((student) => student.id);
    const newStudentIds = students;

    // Determine added and removed students
    const studentsToAdd = newStudentIds.filter(
      (id) => !currentStudentIds.includes(id)
    );
    const studentsToRemove = currentStudentIds.filter(
      (id) => !newStudentIds.includes(id)
    );

    // Update the batch's students
    updateData.students = {
      set: newStudentIds.map((studentId) => ({ id: studentId })),
    };

    // Create batch friendships for added students
    if (studentsToAdd.length > 0) {
      for (const newStudentId of studentsToAdd) {
        // Get other students in the batch (excluding the new student)
        const otherStudentIds = newStudentIds.filter(
          (id) => id !== newStudentId
        );

        if (otherStudentIds.length > 0) {
          const friendData = otherStudentIds.flatMap((otherId) => [
            { userId: newStudentId, friendId: otherId, type: 'BATCH' },
            { userId: otherId, friendId: newStudentId, type: 'BATCH' },
          ]);

          await db.friend.createMany({
            data: friendData,
            skipDuplicates: true,
          });
        }
      }
    }

    // Remove batch friendships for removed students
    if (studentsToRemove.length > 0) {
      for (const removedStudentId of studentsToRemove) {
        // Get students still in the batch
        const remainingStudentIds = newStudentIds;

        // Check if the removed student shares any other batches with these students
        for (const otherStudentId of remainingStudentIds) {
          const sharedBatches = await db.batch.findMany({
            where: {
              id: { not: batch.id },
              students: {
                some: {
                  id: {
                    in: [removedStudentId, otherStudentId],
                  },
                },
              },
            },
            select: { id: true },
          });

          if (sharedBatches.length === 0) {
            // No shared batches, remove batch friendship
            await db.friend.deleteMany({
              where: {
                OR: [
                  {
                    userId: removedStudentId,
                    friendId: otherStudentId,
                    type: 'BATCH',
                  },
                  {
                    userId: otherStudentId,
                    friendId: removedStudentId,
                    type: 'BATCH',
                  },
                ],
              },
            });
          }
        }
      }
    }
  }

  const updatedBatch = await db.batch.update({
    where: {
      id: id,
    },
    data: updateData,
    include: {
      academy: true,
    },
  });

  return updatedBatch;
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

  // Remove batch friendships among students
  if (batch.students.length > 1) {
    const studentIds = batch.students.map((student) => student.id);

    // For each pair of students in the batch
    for (let i = 0; i < studentIds.length; i++) {
      for (let j = i + 1; j < studentIds.length; j++) {
        const studentA = studentIds[i];
        const studentB = studentIds[j];

        // Check if students share other batches
        const sharedBatches = await db.batch.findMany({
          where: {
            id: { not: batch.id },
            students: {
              every: {
                id: {
                  in: [studentA, studentB],
                },
              },
            },
          },
        });

        if (sharedBatches.length === 0) {
          // No shared batches, remove batch friendship
          await db.friend.deleteMany({
            where: {
              OR: [
                {
                  userId: studentA,
                  friendId: studentB,
                  type: 'BATCH',
                },
                {
                  userId: studentB,
                  friendId: studentA,
                  type: 'BATCH',
                },
              ],
            },
          });
        }
      }
    }
  }

  // Proceed to delete the batch
  await db.batch.delete({
    where: {
      id: id,
    },
  });

  return { message: 'Batch deleted successfully' };
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
        },
      },
      startDate: true,
      createdAt: true,
    },
  });

  return allBatches;
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
      students: {
        include: {
          profile: true,
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
  fetchAllBatchesForOptions,
};

module.exports = batchService;
