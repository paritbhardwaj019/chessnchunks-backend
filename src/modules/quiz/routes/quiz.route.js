const express = require('express');
const quizController = require('../controllers/quiz.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkRole = require('../../../middlewares/checkRole');
const ROLE_CONSTANT = require('../../../constants');

const quizRouter = express.Router();

/**
 * @route   PATCH /api/quiz/complete/:attemptId
 * @desc    Complete a quiz attempt
 * @access  Protected (STUDENT)
 */
quizRouter.patch(
  '/complete/:attemptId',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.STUDENT]),
  quizController.completeQuizAttemptHandler
);

/**
 * @route   GET /api/quiz/id/:quizId
 * @desc    Get quiz details by Quiz ID
 * @access  Protected (ADMIN, COACH, STUDENT)
 */
quizRouter.get(
  '/id/:quizId',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
    ROLE_CONSTANT.ROLE.STUDENT,
  ]),
  quizController.getQuizByIdHandler
);

/**
 * @route   GET /api/quiz/student-attempts
 * @desc    Get all quiz attempts for the current student
 * @access  Protected (STUDENT)
 */
quizRouter.get(
  '/student-attempts',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.STUDENT]),
  quizController.getStudentQuizAttemptsHandler
);

/**
 * @route   POST /api/quiz/assign
 * @desc    Assign a quiz by creating a task
 * @access  Protected (ADMIN, COACH)
 */
quizRouter.post(
  '/assign',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.ADMIN, ROLE_CONSTANT.ROLE.COACH]),
  quizController.assignQuizHandler
);

/**
 * @route   GET /api/quiz/options
 * @desc    Get quiz options for dropdowns
 * @access  Protected (ADMIN, COACH)
 */
quizRouter.get(
  '/options',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.ADMIN, ROLE_CONSTANT.ROLE.COACH]),
  quizController.getQuizOptionsHandler
);

quizRouter.get(
  '/',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.ADMIN, ROLE_CONSTANT.ROLE.COACH]),
  quizController.listQuizzesHandler
);

/**
 * @route   POST /api/quiz
 * @desc    Create a new quiz
 * @access  Protected (ADMIN, COACH)
 */
quizRouter.post(
  '/',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.ADMIN, ROLE_CONSTANT.ROLE.COACH]),
  quizController.createQuizHandler
);

/**
 * @route   GET /api/quiz/:taskId
 * @desc    Get quiz details by Task ID
 * @access  Protected (ADMIN, COACH, STUDENT)
 */
quizRouter.get(
  '/:taskId',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
    ROLE_CONSTANT.ROLE.STUDENT,
  ]),
  quizController.getQuizByTaskIdHandler
);

/**
 * @route   POST /api/quiz/attempt/:quizId
 * @desc    Start a new quiz attempt for a Task
 * @access  Protected (STUDENT)
 */
quizRouter.post(
  '/attempt/:quizId',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.STUDENT]),
  quizController.startQuizAttemptHandler
);

/**
 * @route   POST /api/quiz/submit/:attemptId/:questionId
 * @desc    Submit an answer for a specific question in an attempt
 * @access  Protected (STUDENT)
 */
quizRouter.post(
  '/submit/:attemptId/:questionId',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.STUDENT]),
  quizController.submitQuizAnswerHandler
);

/**
 * @route   GET /api/quiz/review/:attemptId
 * @desc    Review a completed quiz attempt
 * @access  Protected (ADMIN, COACH, STUDENT)
 */
quizRouter.get(
  '/review/:attemptId',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
    ROLE_CONSTANT.ROLE.STUDENT,
  ]),
  quizController.reviewQuizAttemptHandler
);

module.exports = quizRouter;
