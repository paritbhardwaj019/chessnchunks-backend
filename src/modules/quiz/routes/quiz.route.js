const express = require('express');
const quizController = require('../controllers/quiz.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkRole = require('../../../middlewares/checkRole');

const quizRouter = express.Router();

/**
 * @route   GET /api/quiz/id/:quizId
 * @desc    Get quiz details by Quiz ID
 * @access  Protected (ADMIN, COACH, STUDENT)
 */
quizRouter.get(
  '/id/:quizId',
  checkJWT,
  checkRole(['ADMIN', 'COACH', 'STUDENT']),
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
  checkRole(['STUDENT']),
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
  checkRole(['ADMIN', 'COACH']),
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
  checkRole(['ADMIN', 'COACH']),
  quizController.getQuizOptionsHandler
);

quizRouter.get(
  '/',
  checkJWT,
  checkRole(['ADMIN', 'COACH']),
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
  checkRole(['ADMIN', 'COACH']),
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
  checkRole(['ADMIN', 'COACH', 'STUDENT']),
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
  checkRole(['STUDENT']),
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
  checkRole(['STUDENT']),
  quizController.submitQuizAnswerHandler
);

/**
 * @route   PATCH /api/quiz/complete/:attemptId
 * @desc    Complete a quiz attempt
 * @access  Protected (STUDENT)
 */
quizRouter.patch(
  '/complete/:attemptId',
  checkJWT,
  checkRole(['STUDENT']),
  quizController.completeQuizAttemptHandler
);

/**
 * @route   GET /api/quiz/review/:attemptId
 * @desc    Review a completed quiz attempt
 * @access  Protected (ADMIN, COACH, STUDENT)
 */
quizRouter.get(
  '/review/:attemptId',
  checkJWT,
  checkRole(['ADMIN', 'COACH', 'STUDENT']),
  quizController.reviewQuizAttemptHandler
);

module.exports = quizRouter;
