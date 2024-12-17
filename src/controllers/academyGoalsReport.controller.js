const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const academyGoalsService = require('../services/acdemyGoalsReport.service');
const { getAndValidateAcademy } = require('./academyProgram.controller');
const ApiError = require('../utils/apiError');

const getAcademyGoalsReport = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);
  const { type, view } = req.query;

  const goalsReport = await academyGoalsService.getAcademyGoalsReport(
    academyId,
    {
      type,
      view,
    }
  );

  res.status(httpStatus.OK).send(goalsReport);
});

const academyGoalsController = {
  getAcademyGoalsReport,
};

module.exports = academyGoalsController;
