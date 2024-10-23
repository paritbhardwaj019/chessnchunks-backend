const express = require('express');
const studentController = require('../../controllers/student.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');

const studentRouter = express.Router();

studentRouter.post(
  '/invite-student',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'COACH', 'ADMIN']),
  studentController.inviteStudentHandler
);

studentRouter.post('/verify-student', studentController.verifyStudentHandler);

studentRouter.get(
  '/all-students',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  studentController.fetchAllStudentsHandler
);

studentRouter.get(
  '/all-students-from-batch',
  checkJWT,
  checkRole(['COACH', 'SUPER_ADMIN', 'ADMIN']),
  studentController.fetchAllStudentsByBatchId
);

studentRouter.patch(
  '/move-student',
  checkJWT,
  checkRole(['COACH', 'SUPER_ADMIN', 'ADMIN']),
  studentController.moveStudentToBatchHandler
);

module.exports = studentRouter;
