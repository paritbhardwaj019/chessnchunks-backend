const express = require('express');
const studentController = require('../../controllers/student.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');

const studentRouter = express.Router();

studentRouter.post(
  '/invite-student',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'COACH']),
  studentController.inviteStudentHandler
);

studentRouter.post('/verify-student', studentController.verifyStudentHandler);

module.exports = studentRouter;
