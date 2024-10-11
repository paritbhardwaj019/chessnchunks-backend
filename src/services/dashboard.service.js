const db = require('../database/prisma');

const fetchAllData = async (loggedInUser) => {
  let dashboardData = {};

  const noOfPendingInvitations = await db.invitation.count({
    where: {
      status: 'PENDING',
      createdBy: {
        id: loggedInUser.id,
      },
    },
  });

  dashboardData.noOfPendingInvitations = noOfPendingInvitations;

  if (loggedInUser.role === 'SUPER_ADMIN') {
    const allAcademies = await db.academy.count();

    const allStudents = await db.user.count({
      where: {
        role: 'STUDENT',
      },
    });

    const noOfBatches = await db.batch.count({});

    dashboardData.allAcademies = allAcademies;
    dashboardData.totalStudents = allStudents;
    dashboardData.noOfBatches = noOfBatches;
  } else if (loggedInUser.role === 'ADMIN') {
    const academies = await db.academy.findMany({
      where: {
        admins: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        batches: {
          include: {
            students: true,
          },
        },
      },
    });

    const noOfBatchesForAdmin = academies.reduce((total, academy) => {
      return total + academy.batches.length;
    }, 0);

    const totalStudentsInBatchesForAdmin = academies.reduce(
      (total, academy) => {
        return (
          total +
          academy.batches.reduce((batchTotal, batch) => {
            return batchTotal + batch.students.length;
          }, 0)
        );
      },
      0
    );

    dashboardData.totalStudents = totalStudentsInBatchesForAdmin;
    dashboardData.noOfBatches = noOfBatchesForAdmin;
  } else if (loggedInUser.role === 'COACH') {
    const batchesForCoach = await db.batch.findMany({
      where: {
        coaches: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        students: true,
      },
    });

    const noOfBatchesForCoach = batchesForCoach.length;

    const totalStudentsInBatchesForCoach = batchesForCoach.reduce(
      (total, batch) => total + batch.students.length,
      0
    );

    dashboardData.totalStudents = totalStudentsInBatchesForCoach;
    dashboardData.noOfBatches = noOfBatchesForCoach;
  }

  return dashboardData;
};

const dashboardService = { fetchAllData };

module.exports = dashboardService;
