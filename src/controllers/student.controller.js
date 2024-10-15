const httpStatus = require('http-status');
const studentService = require('../services/student.service');
const catchAsync = require('../utils/catchAsync');
const _ = require('lodash');

const cleanParam = (param) => {
  if (!param || param === 'undefined') return undefined;
  return param;
};

const inviteStudentHandler = catchAsync(async (req, res) => {
  const studentInvitation = await studentService.inviteStudentHandler(
    req.body,
    req.user
  );
  res.status(httpStatus.OK).send(studentInvitation);
});

const verifyStudentHandler = catchAsync(async (req, res) => {
  const verifyStudentData = await studentService.verifyStudentHandler(
    req.query.token
  );
  res.status(httpStatus.OK).send(verifyStudentData);
});

const fetchAllStudentsHandler = catchAsync(async (req, res) => {
  const allStudents = await studentService.fetchAllStudentsHandler(req.user);
  res.status(httpStatus.OK).send(allStudents);
});

const fetchAllStudentsByBatchId = catchAsync(async (req, res) => {
  let { page, limit, query, batchId } = _.pick(req.query, [
    'page',
    'limit',
    'query',
    'batchId',
  ]);

  query = cleanParam(query);

  const allStudents = await studentService.fetchAllStudentsByBatchId(batchId, {
    page,
    limit,
    query,
  });
  res.status(httpStatus.OK).send(allStudents);
});

const moveStudentToBatchHandler = catchAsync(async (req, res) => {
  console.log('BODY', req.body);

  const updatedStudent = await studentService.moveStudentToBatchHandler(
    req.body.studentId,
    req.body.batchId,
    req.body.toBatchId
  );

  res.status(httpStatus.OK).send(updatedStudent);
});

const studentController = {
  inviteStudentHandler,
  verifyStudentHandler,
  fetchAllStudentsHandler,
  fetchAllStudentsByBatchId,
  moveStudentToBatchHandler,
};

module.exports = studentController;
