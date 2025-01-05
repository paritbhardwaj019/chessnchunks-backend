const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const {
  SIGNUP_STATUS,
  PAYMENT_STATUS,
  USER_STATUS,
} = require('@prisma/client');

const getCurrentSeasonSignupsHandler = async (filters = {}) => {
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

  const signups = await db.userSignup.findMany({
    where,
    include: {
      interestedBatch: {
        select: {
          batchCode: true,
          batchDay: true,
          startTime: true,
        },
      },
      studentSubscriptions: {
        select: {
          academyPlan: {
            select: {
              name: true,
              price: true,
              type: true,
            },
          },
          paymentStatus: true,
        },
        where: {
          status: 'ACTIVE',
        },
        take: 1,
      },
      profile: {
        select: {
          chessComId: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return signups.map((signup) => ({
    signupId: signup.signupId,
    date: signup.createdAt,
    studentInfo: {
      name: `${signup.firstName} ${signup.lastName}`,
      chessComId: signup.profile?.chessComId,
    },
    batchInfo: signup.interestedBatch
      ? {
          code: signup.interestedBatch.batchCode,
          day: signup.interestedBatch.batchDay,
          time: signup.interestedBatch.startTime,
        }
      : null,
    programInfo: signup.studentSubscriptions[0]
      ? {
          name: signup.studentSubscriptions[0].academyPlan.name,
          type: signup.studentSubscriptions[0].academyPlan.type,
          price: signup.studentSubscriptions[0].academyPlan.price,
        }
      : null,
    status: signup.signupStatus,
    paymentStatus: signup.paymentStatus,
    remarks: signup.emailVerified ? 'Email Verified' : 'Email Pending',
  }));
};

const getNewEnrollmentsHandler = async (filters = {}) => {
  const where = {
    signupStatus: SIGNUP_STATUS.CONFIRMED,
    paymentStatus: PAYMENT_STATUS.COMPLETED,
    createdAt: {
      gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
    },
  };

  if (filters.academyId) {
    where.academyId = filters.academyId;
  }

  const newEnrollments = await db.userSignup.findMany({
    where,
    include: {
      interestedBatch: true,
      studentSubscriptions: {
        where: {
          status: 'ACTIVE',
        },
        include: {
          academyPlan: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return newEnrollments.map((enrollment) => ({
    enrollmentDate: enrollment.createdAt,
    student: {
      name: `${enrollment.firstName} ${enrollment.lastName}`,
      email: enrollment.email,
      parentName: enrollment.parentName,
      parentEmail: enrollment.parentEmail,
    },
    batch: enrollment.interestedBatch
      ? {
          code: enrollment.interestedBatch.batchCode,
          startDate: enrollment.interestedBatch.startDate,
        }
      : null,
    program: enrollment.studentSubscriptions[0]
      ? {
          name: enrollment.studentSubscriptions[0].academyPlan.name,
          duration: enrollment.studentSubscriptions[0].academyPlan.duration,
          startDate: enrollment.studentSubscriptions[0].startDate,
          endDate: enrollment.studentSubscriptions[0].endDate,
        }
      : null,
  }));
};

const getWithdrawalsHandler = async (filters = {}) => {
  const where = {
    status: USER_STATUS.INACTIVE,
    updatedAt: {
      gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
    },
  };

  if (filters.academyId) {
    where.academyId = filters.academyId;
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
    },
  });

  return withdrawals.map((withdrawal) => ({
    withdrawalDate: withdrawal.updatedAt,
    student: {
      name: `${withdrawal.profile.firstName} ${withdrawal.profile.lastName}`,
      email: withdrawal.email,
      contact: withdrawal.profile.phoneNumber,
    },
    lastBatch: withdrawal.batchHistory[0]
      ? {
          code: withdrawal.batchHistory[0].batch.batchCode,
          fromDate: withdrawal.batchHistory[0].fromDate,
          toDate: withdrawal.batchHistory[0].toDate,
          reason: withdrawal.batchHistory[0].reason,
        }
      : null,
    lastActiveClass: withdrawal.batchHistory[0]?.oldClass,
    lastLevel: withdrawal.batchHistory[0]?.oldLevel,
  }));
};

const getSignupMetricsHandler = async (academyId) => {
  const currentDate = new Date();
  const thirtyDaysAgo = new Date(
    currentDate.setDate(currentDate.getDate() - 30)
  );

  const metrics = await db.userSignup.groupBy({
    by: ['signupStatus', 'paymentStatus'],
    where: {
      academyId,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    _count: {
      _all: true,
    },
  });

  return {
    total: metrics.reduce((acc, curr) => acc + curr._count._all, 0),
    completed: metrics
      .filter(
        (m) =>
          m.signupStatus === SIGNUP_STATUS.CONFIRMED &&
          m.paymentStatus === PAYMENT_STATUS.COMPLETED
      )
      .reduce((acc, curr) => acc + curr._count._all, 0),
    pending: metrics
      .filter(
        (m) =>
          m.signupStatus === SIGNUP_STATUS.RESERVED ||
          m.paymentStatus === PAYMENT_STATUS.PENDING
      )
      .reduce((acc, curr) => acc + curr._count._all, 0),
    withdrawn: metrics
      .filter((m) => m.signupStatus === 'EXPIRED')
      .reduce((acc, curr) => acc + curr._count._all, 0),
  };
};

const signupReportService = {
  getCurrentSeasonSignupsHandler,
  getNewEnrollmentsHandler,
  getWithdrawalsHandler,
  getSignupMetricsHandler,
};

module.exports = signupReportService;
