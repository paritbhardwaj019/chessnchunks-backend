const httpStatus = require('http-status');
const studentService = require('../services/student.service');
const catchAsync = require('../utils/catchAsync');

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

const studentController = {
  inviteStudentHandler,
  verifyStudentHandler,
  fetchAllStudentsHandler,
};

module.exports = studentController;
