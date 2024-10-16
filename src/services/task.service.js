const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

const formatNumberWithPrefix = require('../utils/formatNumberWithPrefix');
const createTaskHandler = async (data, loggedInUser) => {
  const {
    description,
    prefix,
    startDate,
    endDate,
    status,
    assignedToType,
    assignedToId,
  } = data;
  logger.info('Starting task creation process');

  try {
    const taskCodeCount = await db.taskCode.count({
      where: {
        code: {
          startsWith: prefix,
        },
      },
    });
    const taskCode = formatNumberWithPrefix(prefix, taskCodeCount);

    logger.info(`Generated task code: ${taskCode}`);

    const createdTaskCode = await db.taskCode.create({
      data: {
        code: taskCode,
      },
    });
    logger.info(`Created new task code record with ID: ${createdTaskCode.id}`);

    // Prepare the task data
    let taskData = {
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      createdBy: { connect: { id: loggedInUser.id } }, // Use 'createdBy' with 'connect'
      taskCode: { connect: { id: createdTaskCode.id } }, // Connect the task code
    };

    // Map 'assignedToType' to the correct relation field
    if (assignedToType === 'USER') {
      taskData.assignedToUser = { connect: { id: assignedToId } };
    } else if (assignedToType === 'BATCH') {
      taskData.assignedToBatch = { connect: { id: assignedToId } };
    } else if (assignedToType === 'ACADEMY') {
      taskData.assignedToAcademy = { connect: { id: assignedToId } };
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid assignedToType');
    }

    const task = await db.task.create({
      data: taskData,
      include: {
        assignedToUser: true,
        assignedToBatch: true,
        assignedToAcademy: true,
        createdBy: true,
        taskCode: true,
      },
    });

    logger.info(`Successfully created task with ID: ${task.id}`);
    return task;
  } catch (error) {
    logger.error('Error during task creation', error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Task creation failed'
    );
  }
};

/**
 * Get all tasks accessible to the logged-in user.
 * @param {Object} loggedInUser - The user requesting the tasks.
 * @returns {Promise<Array>} The list of tasks.
 */
const getAllTasks = async (loggedInUser) => {
  let whereCondition = {};

  if (loggedInUser.role === 'SUPER_ADMIN') {
    // Super admin can access all tasks
    whereCondition = {};
  } else if (loggedInUser.role === 'ADMIN') {
    // Admins can access tasks assigned to their academies
    const adminAcademies = await db.academy.findMany({
      where: { admins: { some: { id: loggedInUser.id } } },
      select: { id: true },
    });
    const academyIds = adminAcademies.map((academy) => academy.id);

    whereCondition = {
      OR: [
        { assignedToAcademyId: { in: academyIds } },
        {
          assignedToBatch: { academyId: { in: academyIds } },
        },
        {
          assignedToUser: {
            studentOfBatches: { some: { academyId: { in: academyIds } } },
          },
        },
      ],
    };
  } else if (loggedInUser.role === 'COACH') {
    // Coaches can access tasks assigned to their batches or students
    const coachBatches = await db.batch.findMany({
      where: { coaches: { some: { id: loggedInUser.id } } },
      select: { id: true },
    });
    const batchIds = coachBatches.map((batch) => batch.id);

    whereCondition = {
      OR: [
        { assignedToBatchId: { in: batchIds } },
        {
          assignedToUser: {
            studentOfBatches: { some: { id: { in: batchIds } } },
          },
        },
      ],
    };
  } else if (loggedInUser.role === 'STUDENT') {
    // Students can access tasks assigned to them or their batches
    const studentBatches = await db.batch.findMany({
      where: { students: { some: { id: loggedInUser.id } } },
      select: { id: true },
    });
    const batchIds = studentBatches.map((batch) => batch.id);

    whereCondition = {
      OR: [
        { assignedToUserId: loggedInUser.id },
        { assignedToBatchId: { in: batchIds } },
        { assignedToAcademyId: null }, // Assuming tasks assigned to the entire academy are accessible
      ],
    };
  } else {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }

  const tasks = await db.task.findMany({
    where: whereCondition,
    include: {
      taskCode: true,
      assignedToUser: true,
      assignedToBatch: true,
      assignedToAcademy: true,
      createdBy: true,
    },
  });

  return tasks;
};

/**
 * Get a task by its ID.
 * @param {String} taskId - The ID of the task.
 * @param {Object} loggedInUser - The user requesting the task.
 * @returns {Promise<Object>} The task.
 */
const getTaskById = async (taskId, loggedInUser) => {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      taskCode: true,
      assignedToUser: true,
      assignedToBatch: true,
      assignedToAcademy: true,
      createdBy: true,
    },
  });

  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  // Add authorization checks here if needed

  return task;
};

/**
 * Update an existing task.
 * @param {String} taskId - The ID of the task to update.
 * @param {Object} data - The new task data.
 * @param {Object} loggedInUser - The user performing the update.
 * @returns {Promise<Object>} The updated task.
 */
const updateTask = async (taskId, data, loggedInUser) => {
  const existingTask = await db.task.findUnique({ where: { id: taskId } });

  if (!existingTask) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  // Add authorization checks here if needed

  const updatedTask = await db.task.update({
    where: { id: taskId },
    data,
    include: {
      taskCode: true,
      assignedToUser: true,
      assignedToBatch: true,
      assignedToAcademy: true,
    },
  });

  return updatedTask;
};

/**
 * Delete a task.
 * @param {String} taskId - The ID of the task to delete.
 * @param {Object} loggedInUser - The user performing the deletion.
 * @returns {Promise<Object>} The deleted task.
 */
const deleteTask = async (taskId, loggedInUser) => {
  const existingTask = await db.task.findUnique({ where: { id: taskId } });

  if (!existingTask) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  // Add authorization checks here if needed

  const deletedTask = await db.task.delete({ where: { id: taskId } });

  return deletedTask;
};

module.exports = {
  createTaskHandler,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
