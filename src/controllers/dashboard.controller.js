const httpStatus = require('http-status');
const dashboardService = require('../services/dashboard.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/apiError');

const fetchAllDashboard = catchAsync(async (req, res) => {
  const loggedInUser = req.user;

  let dashboardData = {};

  switch (loggedInUser.role) {
    case 'SUPER_ADMIN':
      dashboardData = await dashboardService.getSuperAdminDashboardData(
        loggedInUser
      );
      break;
    case 'ADMIN':
      dashboardData = await dashboardService.getAdminDashboardData(
        loggedInUser
      );
      break;
    case 'COACH':
      dashboardData = await dashboardService.getCoachDashboardData(
        loggedInUser
      );
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

  console.log('STATS_DATA', statsData);

  res.status(httpStatus.OK).send(statsData);
});

const dashboardController = { fetchAllDashboard, getStudentBatchStats };

module.exports = dashboardController;
