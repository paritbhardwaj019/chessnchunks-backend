const httpStatus = require('http-status');
const academyGoalsService = require('../services/acdemyGoalsReport.service');
const catchAsync = require('../../../utils/catchAsync');
const {
  getAndValidateAcademy,
} = require('../../academyProgram/controllers/academyProgram.controller');

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
