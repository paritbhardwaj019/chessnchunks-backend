const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const _ = require('lodash');
const academyService = require('../services/academy.service');

const updateAcademyByIdHandler = catchAsync(async (req, res) => {
  const { id } = _.pick(req.params, ['id']);

  const updatedAcademy = await academyService.updateAcademyByIdHandler(
    req.body,
    id,
    req.user
  );

  res.status(httpStatus.OK).send(updatedAcademy);
});

const academyController = {
  updateAcademyByIdHandler,
};

module.exports = academyController;
