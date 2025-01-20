const httpStatus = require('http-status');

const dashboardService = require('../services/dashboard.service');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

const fetchAllDashboard = catchAsync(async (req, res) => {
  const loggedInUser = req.user;

  let dashboardData = {};

  switch (loggedInUser.role) {
    case 'SUPER_ADMIN':
      dashboardData =
        await dashboardService.getSuperAdminDashboardData(loggedInUser);
      break;
    case 'ADMIN':
      dashboardData =
        await dashboardService.getAdminDashboardData(loggedInUser);
      break;
    case 'COACH':
      dashboardData =
        await dashboardService.getCoachDashboardData(loggedInUser);
      break;
    default:
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Forbidden');
  }

  res.status(httpStatus.OK).send(dashboardData);
});

const getStudentBatchStats = catchAsync(async (req, res) => {
  const statsData = await dashboardService.getBatchStudentsStatsHandler(
    req.user
  );

  res.status(httpStatus.OK).send(statsData);
});

const getCoachBatchStats = catchAsync(async (req, res) => {
  const performanceData = await dashboardService.getCoachBatchPerformance(
    req.user
  );

  'PERFORMANCE_DATA', performanceData;

  res.status(httpStatus.OK).send(performanceData);
});

const getStudentChessStatsHandler = async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { startDate, endDate } = req.query;

    const stats = await dashboardService.getStudentChessStats(
      loggedInUser.id,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

const dashboardController = {
  fetchAllDashboard,
  getStudentBatchStats,
  getCoachBatchStats,
  getStudentChessStatsHandler,
};

module.exports = dashboardController;
