const academyService = require('../services/academy.service');
const ApiError = require('../utils/apiError');
const academyProgramService = require('../services/academyProgram.service');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');

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
    req.params.programId,
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

  await academyProgramService.deleteProgramById(
    req.params.programId,
    academyId
  );

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

  console.log('academyId', academyId);

  const requiredFields = [
    'name',
    'type',
    'duration',
    'price',
    'startDate',
    'endDate',
  ];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }

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

module.exports = {
  createProgram,
  getPrograms,
  getProgram,
  updateProgram,
  deleteProgram,
  getProgramSubscribers,
  getProgramOptions,
  getAcademyPrograms,
  getAndValidateAcademy,
};
