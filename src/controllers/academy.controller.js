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

const fetchAcademyByIdHandler = catchAsync(async (req, res) => {
  const { id } = _.pick(req.params, ['id']);

  const academy = await academyService.fetchAcademyByIdHandler(id, req.user);

  res.status(httpStatus.OK).send(academy);
});

const academyController = {
  updateAcademyByIdHandler,
  fetchAcademyByIdHandler,
};

module.exports = academyController;
