const httpStatus = require('http-status');
const dashboardService = require('../services/dashboard.service');
const catchAsync = require('../utils/catchAsync');

const fetchAllData = catchAsync(async (req, res) => {
  const allData = await dashboardService.fetchAllData(req.user);
  res.status(httpStatus.OK).send(allData);
});

const dashboardController = {
  fetchAllData,
};

module.exports = dashboardController;
