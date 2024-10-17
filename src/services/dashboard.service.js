const db = require('../database/prisma');

async function getSuperAdminDashboardData() {
  const totalAcademies = await db.academy.count();
  const totalBatches = await db.batch.count();
  const totalStudents = await db.user.count({
    where: { role: 'STUDENT' },
  });
  const totalCoaches = await db.user.count({
    where: { role: 'COACH' },
  });
  const totalPendingInvitations = await db.invitation.count({
    where: { status: 'PENDING' },
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

async function getAdminDashboardData(adminId) {
  const adminWithAcademies = await db.user.findUnique({
    where: { id: adminId },
    select: { adminOfAcademies: { select: { id: true } } },
  });

  const academyIds = adminWithAcademies.adminOfAcademies.map((a) => a.id);

  const totalBatches = await db.batch.count({
    where: { academyId: { in: academyIds } },
  });

  const totalStudents = await db.user.count({
    where: {
      role: 'STUDENT',
      studentOfBatches: {
        some: {
          academyId: { in: academyIds },
        },
      },
    },
  });

  const totalCoaches = await db.user.count({
    where: {
      role: 'COACH',
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

async function getCoachDashboardData(coachId) {
  const coachWithBatches = await db.user.findUnique({
    where: { id: coachId },
    select: { coachOfBatches: { select: { id: true } } },
  });

  const batchIds = coachWithBatches.coachOfBatches.map((b) => b.id);

  const totalBatches = batchIds.length;

  const totalStudents = await db.user.count({
    where: {
      role: 'STUDENT',
      studentOfBatches: { some: { id: { in: batchIds } } },
    },
  });

  const totalPendingInvitations = await db.invitation.count({
    where: {
      status: 'PENDING',
    },
  });

  const totalTasks = await db.task.count({
    where: {
      OR: [
        { assignedToUserId: coachId },
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
