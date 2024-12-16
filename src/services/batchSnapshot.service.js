const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const { USER_STATUS, PAYMENT_STATUS } = require('@prisma/client');

const getBatchesSnapshotHandler = async (filters = {}) => {
  const where = {
    isActive: true,
  };

  if (filters.academyId) {
    where.academyId = filters.academyId;
  }

  const batches = await db.batch.findMany({
    where,
    select: {
      id: true,
      batchCode: true,
      startDate: true,
      endDate: true,
      batchDay: true,
      startTime: true,
      studentCapacity: true,
      warningCutoff: true,
      currentClass: true,
      startLevel: true,
      currentLevel: true,
      _count: {
        select: {
          students: {
            where: {
              status: USER_STATUS.ACTIVE,
            },
          },
        },
      },
      students: {
        include: {
          studentSubscriptions: {
            where: {
              status: 'ACTIVE',
            },
            select: {
              paymentStatus: true,
              startDate: true,
              endDate: true,
              lastBillingDate: true,
              nextBillingDate: true,
            },
            orderBy: {
              startDate: 'desc',
            },
            take: 1,
          },
        },
      },
    },
    orderBy: [{ batchDay: 'asc' }, { startTime: 'asc' }],
  });

  const batchesSnapshot = batches.map((batch) => {
    // Enhanced enrollment status tracking
    const studentStatus = batch.students.reduce(
      (acc, student) => {
        const subscription = student.studentSubscriptions[0];

        if (!subscription) {
          acc.new++;
          return acc;
        }

        switch (subscription.paymentStatus) {
          case PAYMENT_STATUS.COMPLETED:
            acc.paid++;
            // Track upcoming renewals
            if (
              subscription.nextBillingDate &&
              new Date(subscription.nextBillingDate) <=
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            ) {
              acc.upcomingRenewals++;
            }
            break;
          case PAYMENT_STATUS.PENDING:
            acc.pending++;
            break;
          case PAYMENT_STATUS.FAILED:
            acc.withhold++;
            break;
        }

        // Track overdue payments
        if (
          subscription.nextBillingDate &&
          new Date(subscription.nextBillingDate) < new Date()
        ) {
          acc.overdue++;
        }

        return acc;
      },
      {
        paid: 0,
        pending: 0,
        new: 0,
        withhold: 0,
        overdue: 0,
        upcomingRenewals: 0,
      }
    );

    return {
      batchCode: batch.batchCode,
      timing: {
        startDate: batch.startDate,
        endDate: batch.endDate,
        day: batch.batchDay,
        time: batch.startTime,
        duration: '1.5 hours', // You might want to make this configurable
      },
      levels: {
        start: batch.startLevel,
        current: batch.currentLevel,
        currentClass: batch.currentClass,
      },
      enrollment: {
        ...studentStatus,
        total: batch._count.students,
        capacity: batch.studentCapacity,
        warning: batch.warningCutoff,
      },
      capacityStatus: getCapacityStatus(
        batch._count.students,
        batch.studentCapacity,
        batch.warningCutoff
      ),
    };
  });

  return batchesSnapshot;
};

const getBatchSummaryHandler = async (batchId) => {
  const batchSummary = await db.batch.findUnique({
    where: { id: batchId },
    include: {
      students: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              parentName: true,
              parentEmail: true,
              phoneNumber: true,
            },
          },
          studentSubscriptions: {
            where: {
              status: 'ACTIVE',
            },
            select: {
              paymentStatus: true,
              startDate: true,
              endDate: true,
              lastBillingDate: true,
              nextBillingDate: true,
              autoRenew: true,
              academyPlan: {
                select: {
                  name: true,
                  price: true,
                  type: true,
                  duration: true,
                },
              },
            },
            orderBy: {
              startDate: 'desc',
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!batchSummary) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
  }

  return {
    batchCode: batchSummary.batchCode,
    students: batchSummary.students.map((student) => ({
      id: student.id,
      name: `${student.profile.firstName} ${student.profile.lastName}`,
      contact: {
        email: student.email,
        phone: student.profile.phoneNumber,
        parent: {
          name: student.profile.parentName,
          email: student.profile.parentEmail,
        },
      },
      subscription: student.studentSubscriptions[0]
        ? {
            status: student.studentSubscriptions[0].paymentStatus,
            plan: student.studentSubscriptions[0].academyPlan.name,
            price: student.studentSubscriptions[0].academyPlan.price,
            dates: {
              start: student.studentSubscriptions[0].startDate,
              end: student.studentSubscriptions[0].endDate,
              lastBilling: student.studentSubscriptions[0].lastBillingDate,
              nextBilling: student.studentSubscriptions[0].nextBillingDate,
            },
            autoRenew: student.studentSubscriptions[0].autoRenew,
            paymentStatus: getPaymentStatusWithWarnings(
              student.studentSubscriptions[0]
            ),
          }
        : {
            status: 'NO_SUBSCRIPTION',
            paymentStatus: {
              status: 'INACTIVE',
              warning: 'No active subscription',
            },
          },
    })),
  };
};

const getCapacityStatus = (currentCount, capacity, warningCutoff) => {
  const percentFull = (currentCount / capacity) * 100;
  if (percentFull >= warningCutoff) {
    return 'NEAR_CAPACITY';
  } else if (currentCount >= capacity) {
    return 'FULL';
  }
  return 'AVAILABLE';
};

const getPaymentStatusWithWarnings = (subscription) => {
  const warnings = [];
  const today = new Date();

  if (subscription.nextBillingDate) {
    const daysUntilBilling = Math.ceil(
      (new Date(subscription.nextBillingDate) - today) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilBilling < 0) {
      warnings.push('Payment overdue');
    } else if (daysUntilBilling <= 7) {
      warnings.push('Payment due soon');
    }
  }

  if (subscription.endDate && new Date(subscription.endDate) <= today) {
    warnings.push('Subscription expired');
  }

  return {
    status: subscription.paymentStatus,
    warnings: warnings.length > 0 ? warnings : null,
  };
};

const getTotalBatchesCount = async (academyId) => {
  return db.batch.count({
    where: {
      academyId,
    },
  });
};

const getActiveBatchesCount = async (academyId) => {
  return db.batch.count({
    where: {
      academyId,
      isActive: true,
      endDate: {
        gte: new Date(),
      },
    },
  });
};

const getNearCapacityBatchesCount = async (academyId) => {
  const batches = await db.batch.findMany({
    where: {
      academyId,
      isActive: true,
    },
    include: {
      _count: {
        select: {
          students: {
            where: {
              status: USER_STATUS.ACTIVE,
            },
          },
        },
      },
    },
  });

  return batches.filter((batch) => {
    const percentFull = (batch._count.students / batch.studentCapacity) * 100;
    return percentFull >= batch.warningCutoff;
  }).length;
};

const getAttentionRequiredBatchesCount = async (academyId) => {
  const batches = await db.batch.findMany({
    where: {
      academyId,
      isActive: true,
    },
    include: {
      students: {
        include: {
          studentSubscriptions: {
            where: {
              status: 'ACTIVE',
            },
            select: {
              paymentStatus: true,
              nextBillingDate: true,
            },
          },
        },
      },
    },
  });

  return batches.filter((batch) => {
    const overduePayments = batch.students.filter((student) => {
      const subscription = student.studentSubscriptions[0];
      if (!subscription) return false;
      return (
        subscription.paymentStatus === PAYMENT_STATUS.PENDING ||
        (subscription.nextBillingDate &&
          new Date(subscription.nextBillingDate) < new Date())
      );
    }).length;

    return overduePayments > 0;
  }).length;
};

const getBatchTrendsHandler = async (academyId, timeframe = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);

  const batches = await db.batch.findMany({
    where: {
      academyId,
      createdAt: {
        gte: startDate,
      },
    },
    include: {
      _count: {
        select: {
          students: true,
        },
      },
      students: {
        include: {
          studentSubscriptions: {
            where: {
              status: 'ACTIVE',
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const trends = batches.map((batch) => ({
    date: batch.createdAt,
    totalStudents: batch._count.students,
    activeSubscriptions: batch.students.filter(
      (s) => s.studentSubscriptions.length > 0
    ).length,
    capacityUtilization: Math.round(
      (batch._count.students / batch.studentCapacity) * 100
    ),
  }));

  return trends;
};

const generateBatchReportHandler = async (academyId, format = 'csv') => {
  const batches = await getBatchesSnapshotHandler({ academyId });

  if (format === 'csv') {
    const fields = [
      'batchCode',
      'timing.startDate',
      'timing.day',
      'timing.time',
      'levels.current',
      'enrollment.total',
      'enrollment.paid',
      'enrollment.pending',
      'enrollment.capacity',
      'capacityStatus',
    ];

    const parser = new Parser({ fields });
    return parser.parse(batches);
  }

  if (format === 'xlsx') {
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Batch Report');

    // Add headers
    const headers = [
      'Batch Code',
      'Start Date',
      'Day',
      'Time',
      'Current Level',
      'Total Students',
      'Paid',
      'Pending',
      'Capacity',
      'Status',
    ];

    headers.forEach((header, i) => {
      ws.cell(1, i + 1).string(header);
    });

    batches.forEach((batch, i) => {
      ws.cell(i + 2, 1).string(batch.batchCode);
      ws.cell(i + 2, 2).date(new Date(batch.timing.startDate));
      ws.cell(i + 2, 3).string(batch.timing.day);
      ws.cell(i + 2, 4).string(batch.timing.time);
      ws.cell(i + 2, 5).string(batch.levels.current.toString());
      ws.cell(i + 2, 6).number(batch.enrollment.total);
      ws.cell(i + 2, 7).number(batch.enrollment.paid);
      ws.cell(i + 2, 8).number(batch.enrollment.pending);
      ws.cell(i + 2, 9).number(batch.enrollment.capacity);
      ws.cell(i + 2, 10).string(batch.capacityStatus);
    });

    return wb.writeToBuffer();
  }

  throw new ApiError(httpStatus.BAD_REQUEST, 'Unsupported export format');
};

const batchesSnapshotService = {
  getBatchesSnapshotHandler,
  getBatchSummaryHandler,
  getTotalBatchesCount,
  getActiveBatchesCount,
  getNearCapacityBatchesCount,
  getAttentionRequiredBatchesCount,
  getBatchTrendsHandler,
  generateBatchReportHandler,
};

module.exports = batchesSnapshotService;
