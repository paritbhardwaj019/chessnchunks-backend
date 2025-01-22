const {
  SIGNUP_STATUS,
  PAYMENT_STATUS,
  USER_STATUS,
} = require('@prisma/client');
const httpStatus = require('http-status');
const db = require('../../../database/prisma');
const ApiError = require('../../../utils/apiError');

const getCurrentSeasonEnrollmentsHandler = async (filters = {}) => {
  try {
    const currentDate = new Date();
    const seasonStartDate = new Date(
      currentDate.getFullYear(),
      Math.floor(currentDate.getMonth() / 3) * 3,
      1
    );
    const seasonEndDate = new Date(
      currentDate.getFullYear(),
      Math.floor(currentDate.getMonth() / 3) * 3 + 3,
      0
    );

    const where = {
      createdAt: {
        gte: seasonStartDate,
        lte: seasonEndDate,
      },
    };

    if (filters.academyId) {
      where.academyId = filters.academyId;
    }

    if (filters.status) {
      where.signupStatus = filters.status;
    }

    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    const enrollments = await db.userSignup.findMany({
      where,
      include: {
        interestedBatch: {
          select: {
            batchCode: true,
            batchDay: true,
            startTime: true,
            startDate: true,
            studentCapacity: true,
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
        user: {
          select: {
            studentSubscriptions: {
              where: {
                status: 'ACTIVE',
              },
              include: {
                academyPlan: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return enrollments.map((enrollment) => ({
      signupId: enrollment.signupId,
      studentInfo: {
        name: `${enrollment.firstName} ${enrollment.lastName}`,
        email: enrollment.email,
        contact: enrollment.phoneNumber,
        parentInfo: {
          name: enrollment.parentName,
          email: enrollment.parentEmail,
        },
      },
      batchInfo: enrollment.interestedBatch
        ? {
            code: enrollment.interestedBatch.batchCode,
            schedule: {
              day: enrollment.interestedBatch.batchDay,
              time: enrollment.interestedBatch.startTime,
              startDate: enrollment.interestedBatch.startDate,
            },
            capacity: {
              total: enrollment.interestedBatch.studentCapacity,
              current: enrollment.interestedBatch._count.students,
            },
          }
        : null,
      subscription: enrollment.user?.studentSubscriptions[0]
        ? {
            plan: enrollment.user.studentSubscriptions[0].academyPlan.name,
            amount: enrollment.user.studentSubscriptions[0].academyPlan.price,
            status: enrollment.user.studentSubscriptions[0].paymentStatus,
          }
        : null,
      status: {
        signup: enrollment.signupStatus,
        registration: enrollment.signupStage,
        payment: enrollment.paymentStatus,
      },
      dates: {
        signup: enrollment.createdAt,
        expiry: enrollment.reservationExpiry,
        payment: enrollment.paymentDate,
      },
    }));
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error fetching current season enrollments'
    );
  }
};

const getNewEnrollmentsHandler = async (filters = {}) => {
  try {
    const where = {
      signupStatus: SIGNUP_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      createdAt: {
        gte: new Date(
          new Date().setDate(new Date().getDate() - (filters.days || 30))
        ),
      },
    };

    if (filters.academyId) {
      where.academyId = filters.academyId;
    }

    const newEnrollments = await db.userSignup.findMany({
      where,
      include: {
        interestedBatch: true,
        user: {
          include: {
            studentSubscriptions: {
              where: {
                status: 'ACTIVE',
              },
              include: {
                academyPlan: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return newEnrollments.map((enrollment) => ({
      studentInfo: {
        name: `${enrollment.firstName} ${enrollment.lastName}`,
        email: enrollment.email,
        contact: enrollment.phoneNumber,
        parentInfo: {
          name: enrollment.parentName,
          email: enrollment.parentEmail,
        },
      },
      batchInfo: enrollment.interestedBatch
        ? {
            code: enrollment.interestedBatch.batchCode,
            startDate: enrollment.interestedBatch.startDate,
          }
        : null,
      enrollmentDetails: {
        date: enrollment.createdAt,
        completionDate: enrollment.paymentDate,
        status: enrollment.signupStatus,
      },
      programInfo: enrollment.user?.studentSubscriptions[0]
        ? {
            name: enrollment.user.studentSubscriptions[0].academyPlan.name,
            type: enrollment.user.studentSubscriptions[0].academyPlan.type,
            duration:
              enrollment.user.studentSubscriptions[0].academyPlan.duration,
            price: enrollment.user.studentSubscriptions[0].academyPlan.price,
          }
        : null,
    }));
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error fetching new enrollments'
    );
  }
};

const getWithdrawalsHandler = async (filters = {}) => {
  try {
    const where = {
      status: USER_STATUS.INACTIVE,
      updatedAt: {
        gte: new Date(
          new Date().setDate(new Date().getDate() - (filters.days || 30))
        ),
      },
    };

    if (filters.academyId) {
      where.assignedToAcademyId = filters.academyId;
    }

    const withdrawals = await db.user.findMany({
      where,
      include: {
        profile: true,
        batchHistory: {
          include: {
            batch: true,
          },
          orderBy: {
            toDate: 'desc',
          },
          take: 1,
        },
        studentSubscriptions: {
          where: {
            status: 'EXPIRED',
          },
          orderBy: {
            endDate: 'desc',
          },
          take: 1,
          include: {
            academyPlan: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return withdrawals.map((withdrawal) => ({
      studentInfo: {
        name: `${withdrawal.profile.firstName} ${withdrawal.profile.lastName}`,
        email: withdrawal.email,
        contact: withdrawal.profile.phoneNumber,
        parentInfo: {
          name: withdrawal.profile.parentName,
          email: withdrawal.profile.parentEmail,
        },
      },
      lastBatch: withdrawal.batchHistory[0]
        ? {
            code: withdrawal.batchHistory[0].batch.batchCode,
            period: {
              from: withdrawal.batchHistory[0].fromDate,
              to: withdrawal.batchHistory[0].toDate,
            },
            details: {
              oldClass: withdrawal.batchHistory[0].oldClass,
              oldLevel: withdrawal.batchHistory[0].oldLevel,
              reason: withdrawal.batchHistory[0].reason,
            },
          }
        : null,
      subscription: withdrawal.studentSubscriptions[0]
        ? {
            plan: withdrawal.studentSubscriptions[0].academyPlan.name,
            endDate: withdrawal.studentSubscriptions[0].endDate,
          }
        : null,
      withdrawalDate: withdrawal.updatedAt,
    }));
  } catch (error) {
    'ERROR', error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error fetching withdrawals'
    );
  }
};

const getEnrollmentMetricsHandler = async (academyId, timeframe = 30) => {
  try {
    const startDate = new Date(
      new Date().setDate(new Date().getDate() - timeframe)
    );

    const [signups, withdrawals] = await Promise.all([
      db.userSignup.groupBy({
        by: ['signupStatus', 'paymentStatus'],
        where: {
          academyId,
          createdAt: {
            gte: startDate,
          },
        },
        _count: true,
      }),
      db.user.count({
        where: {
          status: USER_STATUS.INACTIVE,
          assignedToAcademyId: academyId,
          updatedAt: {
            gte: startDate,
          },
        },
      }),
    ]);

    return {
      total: signups.reduce((acc, curr) => acc + curr._count, 0),
      completed: signups
        .filter(
          (s) =>
            s.signupStatus === SIGNUP_STATUS.CONFIRMED &&
            s.paymentStatus === PAYMENT_STATUS.COMPLETED
        )
        .reduce((acc, curr) => acc + curr._count, 0),
      pending: signups
        .filter(
          (s) =>
            s.signupStatus === SIGNUP_STATUS.RESERVED ||
            s.paymentStatus === PAYMENT_STATUS.PENDING
        )
        .reduce((acc, curr) => acc + curr._count, 0),
      withdrawn: withdrawals,
      timeframe,
    };
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error fetching enrollment metrics'
    );
  }
};

const enrollmentReportService = {
  getCurrentSeasonEnrollmentsHandler,
  getNewEnrollmentsHandler,
  getWithdrawalsHandler,
  getEnrollmentMetricsHandler,
};

module.exports = enrollmentReportService;
