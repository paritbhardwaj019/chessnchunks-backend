const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const _ = require('lodash');
const quizService = require('../services/quiz.service');

/**
 * Create Quiz Handler
 */
const createQuizHandler = catchAsync(async (req, res) => {
  const quiz = await quizService.createQuiz(req.body, req.user.id);
  res.status(httpStatus.CREATED).send(quiz);
});

/**
 * Get Quiz by Task ID Handler
 */
const getQuizByTaskIdHandler = catchAsync(async (req, res) => {
  const { taskId } = _.pick(req.params, ['taskId']);
  const quiz = await quizService.getQuizByTaskId(taskId);
  res.status(httpStatus.OK).send(quiz);
});

/**
 * Start Quiz Attempt Handler
 */
const startQuizAttemptHandler = catchAsync(async (req, res) => {
  const { taskId } = _.pick(req.params, ['taskId']);
  const attempt = await quizService.startQuizAttempt(taskId, req.user.id);
  res.status(httpStatus.CREATED).send(attempt);
});

/**
 * Submit Quiz Answer Handler
 */
const submitQuizAnswerHandler = catchAsync(async (req, res) => {
  const { attemptId, questionId } = _.pick(req.params, [
    'attemptId',
    'questionId',
  ]);
  const { answer } = req.body;
  const result = await quizService.submitQuizAnswer(
    attemptId,
    questionId,
    answer
  );
  res.status(httpStatus.OK).send(result);
});

/**
 * Complete Quiz Attempt Handler
 */
const completeQuizAttemptHandler = catchAsync(async (req, res) => {
  const { attemptId } = _.pick(req.params, ['attemptId']);
  const result = await quizService.completeQuizAttempt(attemptId);
  res.status(httpStatus.OK).send(result);
});

/**
 * Review Quiz Attempt Handler
 */
const reviewQuizAttemptHandler = catchAsync(async (req, res) => {
  const { attemptId } = _.pick(req.params, ['attemptId']);
  const review = await quizService.reviewQuizAttempt(attemptId);
  res.status(httpStatus.OK).send(review);
});

/**
 * List All Quizzes Handler
 */
const listQuizzesHandler = catchAsync(async (req, res) => {
  const { status, taskId, search, skip, take } = req.query;

  const filters = { status, taskId, search };
  const pagination = {
    skip: skip ? parseInt(skip, 10) : 0,
    take: take ? parseInt(take, 10) : 10,
  };

  const quizzes = await quizService.listQuizzes(filters, pagination);
  res.status(httpStatus.OK).send(quizzes);
});

/**
 * Get Quiz by ID Handler
 */
const getQuizByIdHandler = catchAsync(async (req, res) => {
  const { quizId } = _.pick(req.params, ['quizId']);
  const quiz = await quizService.getQuizById(quizId);
  res.status(httpStatus.OK).send(quiz);
});

/**
 * Update Quiz Handler
 */
const updateQuizHandler = catchAsync(async (req, res) => {
  const { quizId } = _.pick(req.params, ['quizId']);
  const updatedQuiz = await quizService.updateQuiz(
    quizId,
    req.body,
    req.user.id
  );
  res.status(httpStatus.OK).send(updatedQuiz);
});

/**
 * Delete Quiz Handler
 */
const deleteQuizHandler = catchAsync(async (req, res) => {
  const { quizId } = _.pick(req.params, ['quizId']);
  await quizService.deleteQuiz(quizId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getQuizOptionsHandler = catchAsync(async (req, res) => {
  const options = await quizService.getQuizOptions();
  res.status(httpStatus.OK).json({
    status: 'success',
    data: {
      options,
    },
  });
});

/**
 * Assign Quiz Handler
 * Creates a task for quiz assignment
 */
const assignQuizHandler = catchAsync(async (req, res) => {
  const assignmentData = {
    quizId: req.body.quizId,
    description: req.body.description,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    status: req.body.status || 'NOT_STARTED',
    assignmentType: req.body.assignedToType,
    assigneeId: req.body.assignedToId,
  };

  const assignment = await quizService.assignQuizWithTask(
    assignmentData,
    req.user
  );
  res.status(httpStatus.CREATED).send(assignment);
});

const getStudentQuizAttemptsHandler = catchAsync(async (req, res) => {
  const attempts = await quizService.getStudentQuizAttempts(req.user.id);
  res.status(httpStatus.OK).send(attempts);
});

const quizController = {
  createQuizHandler,
  getQuizByTaskIdHandler,
  startQuizAttemptHandler,
  submitQuizAnswerHandler,
  completeQuizAttemptHandler,
  reviewQuizAttemptHandler,
  listQuizzesHandler,
  getQuizByIdHandler,
  updateQuizHandler,
  deleteQuizHandler,
  getQuizOptionsHandler,
  assignQuizHandler,
  getStudentQuizAttemptsHandler,
};

module.exports = quizController;
