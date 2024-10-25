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

const dashboardController = { fetchAllDashboard };

module.exports = dashboardController;
