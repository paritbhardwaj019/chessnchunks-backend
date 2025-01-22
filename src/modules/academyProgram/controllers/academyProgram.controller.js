const httpStatus = require('http-status');
const academyService = require('../../academy/services/academy.service');
const academyProgramService = require('../services/academyProgram.service');
const ApiError = require('../../../utils/apiError');
const catchAsync = require('../../../utils/catchAsync');
const pick = require('../../../utils/pick');

const getAndValidateAcademy = async (loggedInUser) => {
  const academy = await academyService.getSingleAcademyForUser(loggedInUser);
  if (!academy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Academy not found for user');
  }
  return academy.id;
};

const getPrograms = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);

  const filters = pick(req.query, [
    'search',
    'type',
    'duration',
    'isActive',
    'startDateFrom',
    'startDateTo',
    'priceFrom',
    'priceTo',
  ]);

  const options = pick(req.query, ['sortBy', 'limit', 'page', 'sortOrder']);

  const result = await academyProgramService.listAllPrograms(academyId, {
    ...filters,
    ...options,
  });

  res.send(result);
});

/**
 * Get program by id
 */
const getProgram = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);

  const program = await academyProgramService.getProgramById(
    req.params.programId,
    academyId
  );

  res.send(program);
});

/**
 * Update program
 */
const updateProgram = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);

  // Validate based on PDF requirements
  if (req.body.price) {
    if (typeof req.body.price !== 'number' || req.body.price < 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid price value');
    }
  }

  if (req.body.type && !['P0', 'P1', 'P2', 'P3'].includes(req.body.type)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid program type');
  }

  if (
    req.body.duration &&
    !['MONTHLY', 'SEASONAL', 'SINGLE'].includes(req.body.duration)
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid duration');
  }

  // Date validations
  if (req.body.startDate && req.body.endDate) {
    const start = new Date(req.body.startDate);
    const end = new Date(req.body.endDate);
    if (start >= end) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Start date must be before end date'
      );
    }
  }

  const program = await academyProgramService.updateAcademyProgramById(
    req.params.id,
    academyId,
    req.body
  );

  res.send(program);
});

/**
 * Delete program
 */
const deleteProgram = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);

  await academyProgramService.deleteProgramById(req.params.id);

  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Get program subscribers
 */
const getProgramSubscribers = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);

  const subscribers = await academyProgramService.getProgramSubscribers(
    req.params.id,
    academyId
  );

  res.status(httpStatus.OK).send(subscribers);
});

const getProgramOptions = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);

  const result = await academyProgramService.getProgramOptions(academyId);
  res.status(httpStatus.OK).send(result);
});

const createProgram = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);

  const program = await academyProgramService.createProgramHandler(
    req.body,
    academyId,
    req.user
  );

  res.status(httpStatus.CREATED).send(program);
});

const getAcademyPrograms = catchAsync(async (req, res) => {
  const result = await academyProgramService.getAcademyPrograms(
    req.params.academyId
  );
  res.status(httpStatus.OK).send(result);
});

const updateProgramCredits = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);

  const creditData = pick(req.body, [
    'creditPoints',
    'condition',
    'discountRules',
    'discountAmount',
    'latePaymentFees',
    'dueDate',
  ]);

  if (!creditData.creditPoints) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Credit points are required');
  }

  const creditPoints = Number(creditData.creditPoints);
  if (isNaN(creditPoints) || creditPoints < 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid credit points value');
  }

  if (creditData.discountAmount) {
    const discountAmount = Number(creditData.discountAmount);
    if (isNaN(discountAmount) || discountAmount < 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid discount amount');
    }
  }

  if (creditData.latePaymentFees) {
    const latePaymentFees = Number(creditData.latePaymentFees);
    if (isNaN(latePaymentFees) || latePaymentFees < 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid late payment fees');
    }
  }

  if (creditData.dueDate) {
    const dueDate = new Date(creditData.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid due date format');
    }
  }

  const updatedProgram = await academyProgramService.updateProgramCredits(
    req.params.id,
    academyId,
    creditData
  );

  res.send(updatedProgram);
});

const academyProgramController = {
  createProgram,
  getPrograms,
  getProgram,
  updateProgram,
  deleteProgram,
  getProgramSubscribers,
  getProgramOptions,
  getAcademyPrograms,
  getAndValidateAcademy,
  updateProgramCredits,
};

module.exports = academyProgramController;
