const db = require('../database/prisma');
const httpStatus = require('http-status');
const ApiError = require('../utils/apiError');

/**
 * Service to fetch dashboard data for Super Admins.
 * @param {Object} loggedInUser - The user object of the logged-in Super Admin.
 * @returns {Object} - Aggregated dashboard data.
 */
async function getSuperAdminDashboardData(loggedInUser) {
  if (loggedInUser.role !== 'SUPER_ADMIN') {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Access denied. Only Super Admins can access this data.'
    );
  }

  const totalAcademies = await db.academy.count();
  const totalBatches = await db.batch.count();
  const totalStudents = await db.user.count({
    where: {
      role: {
        name: 'STUDENT',
      },
    },
  });
  const totalCoaches = await db.user.count({
    where: {
      role: {
        name: 'COACH',
      },
    },
  });
  const totalPendingInvitations = await db.invitation.count({
    where: {
      status: 'PENDING',
      createdById: loggedInUser.id,
    },
  });
  const totalTasks = await db.task.count();

  return {
    totalAcademies,
    totalBatches,
    totalStudents,
    totalCoaches,
    totalPendingInvitations,
    totalTasks,
  };
}

/**
 * Service to fetch dashboard data for Admins.
 * @param {Object} loggedInUser - The user object of the logged-in Admin.
 * @returns {Object} - Aggregated dashboard data.
 */
async function getAdminDashboardData(loggedInUser) {
  // Ensure the loggedInUser has the role 'ADMIN'
  if (loggedInUser.role !== 'ADMIN') {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Access denied. Only Admins can access this data.'
    );
  }

  const adminWithAcademies = await db.user.findUnique({
    where: { id: loggedInUser.id },
    select: { adminOfAcademies: { select: { id: true } } },
  });

  if (!adminWithAcademies) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Admin user not found or has no associated academies.'
    );
  }

  const academyIds = adminWithAcademies.adminOfAcademies.map((a) => a.id);

  const totalBatches = await db.batch.count({
    where: { academyId: { in: academyIds } },
  });

  const totalStudents = await db.user.count({
    where: {
      role: {
        name: 'STUDENT',
      },
      studentOfBatches: {
        some: {
          academyId: { in: academyIds },
        },
      },
    },
  });

  const totalCoaches = await db.user.count({
    where: {
      role: {
        name: 'COACH',
      },
      coachOfBatches: {
        some: {
          academyId: { in: academyIds },
        },
      },
    },
  });

  const totalPendingInvitations = await db.invitation.count({
    where: {
      status: 'PENDING',
      createdById: loggedInUser.id, // Filter by creator
    },
  });

  const totalTasks = await db.task.count({
    where: {
      assignedToAcademyId: { in: academyIds },
    },
  });

  return {
    totalBatches,
    totalStudents,
    totalCoaches,
    totalPendingInvitations,
    totalTasks,
  };
}

/**
 * Service to fetch dashboard data for Coaches.
 * @param {Object} loggedInUser - The user object of the logged-in Coach.
 * @returns {Object} - Aggregated dashboard data.
 */
async function getCoachDashboardData(loggedInUser) {
  // Ensure the loggedInUser has the role 'COACH'
  if (loggedInUser.role !== 'COACH') {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Access denied. Only Coaches can access this data.'
    );
  }

  const coachWithBatches = await db.user.findUnique({
    where: { id: loggedInUser.id },
    select: { coachOfBatches: { select: { id: true } } },
  });

  if (!coachWithBatches) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Coach user not found or has no associated batches.'
    );
  }

  const batchIds = coachWithBatches.coachOfBatches.map((b) => b.id);

  const totalBatches = batchIds.length;

  const totalStudents = await db.user.count({
    where: {
      role: {
        name: 'STUDENT',
      },
      studentOfBatches: { some: { id: { in: batchIds } } },
    },
  });

  const totalPendingInvitations = await db.invitation.count({
    where: {
      status: 'PENDING',
      createdById: loggedInUser.id, // Filter by creator
    },
  });

  const totalTasks = await db.task.count({
    where: {
      OR: [
        { assignedToUserId: loggedInUser.id },
        { assignedToBatchId: { in: batchIds } },
      ],
    },
  });

  return {
    totalBatches,
    totalStudents,
    totalPendingInvitations,
    totalTasks,
  };
}

const dashboardService = {
  getSuperAdminDashboardData,
  getAdminDashboardData,
  getCoachDashboardData,
};

module.exports = dashboardService;
