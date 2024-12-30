const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const generateSystemCode = require('../utils/generateSystemCode');
const { SYSTEM_CODE_MODULE } = require('@prisma/client');

/**
 * Create a new task
 * @param {Object} data Task data
 * @param {Object} loggedInUser Current logged in user
 * @returns {Promise<Object>} Created task
 */
const createTaskHandler = async (data, loggedInUser) => {
  const {
    description,
    startDate,
    endDate,
    status,
    assignedToType,
    assignedToId,
  } = data;

  logger.info('Starting task creation process');

  try {
    const taskId = await generateSystemCode(SYSTEM_CODE_MODULE.TASK);

    let taskData = {
      taskId,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      createdById: loggedInUser.id,
    };

    if (assignedToType === 'USER') {
      taskData.assignedToUserId = assignedToId;
    } else if (assignedToType === 'BATCH') {
      taskData.assignedToBatchId = assignedToId;
    } else if (assignedToType === 'ACADEMY') {
      taskData.assignedToAcademyId = assignedToId;
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid assignedToType');
    }

    const task = await db.task.create({
      data: taskData,
      include: {
        assignedToUser: {
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
        assignedToBatch: {
          select: {
            id: true,
            batchCode: true,
            description: true,
          },
        },
        assignedToAcademy: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
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
    });

    logger.info(`Successfully created task with ID: ${task.id}`);
    return task;
  } catch (error) {
    logger.error('Error during task creation:', error);
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
  let whereCondition = {
    createdById: loggedInUser.id,
  };

  const studentRole = await db.role.findFirst({
    where: {
      name: 'STUDENT',
    },
  });

  if (loggedInUser.roleId === studentRole.id) {
    const studentBatches = await db.batch.findMany({
      where: { students: { some: { id: loggedInUser.id } } },
      select: { id: true },
    });

    const batchIds = studentBatches.map((batch) => batch.id);

    whereCondition = {
      OR: [
        { assignedToUserId: loggedInUser.id },
        { assignedToBatchId: { in: batchIds } },
        { assignedToAcademyId: null },
      ],
    };
  }

  const tasks = await db.task.findMany({
    where: whereCondition,
    include: {
      assignedToUser: {
        include: {
          profile: true,
        },
      },
      assignedToBatch: true,
      assignedToAcademy: true,
      createdBy: {
        include: {
          profile: true,
        },
      },
      quizzes: true,
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

  console.log('DATA', data);

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
