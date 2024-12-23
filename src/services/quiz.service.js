const httpStatus = require('http-status');
const ApiError = require('../utils/apiError');
const db = require('../database/prisma');
const generateSystemCode = require('../utils/generateSystemCode');
const { SYSTEM_CODE_MODULE } = require('@prisma/client');

const questionTypeMapping = {
  mcq: 'MULTIPLE_CHOICE',
  'true-false': 'TRUE_FALSE',
  'fill-blanks': 'SHORT_ANSWER',
};

const createQuiz = async (data, userId) => {
  const { title, description, timeLimit, passingScore, taskId, questions } =
    data;

  const quizCode = await generateSystemCode(SYSTEM_CODE_MODULE.QUIZ);

  const mappedQuestions = await Promise.all(
    questions.map(async (q, index) => {
      const questionCode = await generateSystemCode(
        SYSTEM_CODE_MODULE.QUIZ_QUESTION
      );
      return {
        questionText: q.questionText,
        type: questionTypeMapping[q.type] || q.type,
        marks: q.marks,
        orderIndex: index + 1,
        questionCode,
        options: q.options,
        correctAnswer: q.correctAnswer,
      };
    })
  );

  const quiz = await db.quiz.create({
    data: {
      title,
      description,
      timeLimit,
      passingScore,
      quizCode,
      taskId,
      createdById: userId,
      questions: {
        create: mappedQuestions,
      },
    },
    include: {
      questions: true,
      task: true,
    },
  });

  return quiz;
};

const getQuizByTaskId = async (taskId) => {
  const quiz = await db.quiz.findFirst({
    where: { taskId },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found for this task');
  }
  return quiz;
};

const startQuizAttempt = async (taskId, userId) => {
  const attempt = await db.studentQuizAttempt.findFirst({
    where: {
      taskId,
      userId,
      status: { not: 'COMPLETED' },
    },
  });

  if (attempt) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Active attempt exists');
  }

  return db.studentQuizAttempt.create({
    data: {
      taskId,
      userId,
      startTime: new Date(),
      status: 'IN_PROGRESS',
    },
  });
};

const submitQuizAnswer = async (attemptId, questionId, answer) => {
  const attempt = await db.studentQuizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: true,
      task: {
        include: {
          quizzes: {
            include: {
              questions: true,
            },
          },
        },
      },
    },
  });

  if (!attempt || attempt.status === 'COMPLETED') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid attempt');
  }

  const question = attempt.task.quizzes[0].questions.find(
    (q) => q.id === questionId
  );
  const isCorrect = question.correctAnswer === answer;

  return db.studentQuizAnswer.create({
    data: {
      attemptId,
      questionId,
      answerText: answer,
      isCorrect,
      marksObtained: isCorrect ? question.marks : 0,
    },
  });
};

const completeQuizAttempt = async (attemptId) => {
  const attempt = await db.studentQuizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: true,
      task: {
        include: {
          quizzes: {
            include: {
              questions: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Attempt not found');
  }

  const totalMarks = attempt.task.quizzes[0].questions.reduce(
    (sum, q) => sum + q.marks,
    0
  );
  const obtainedMarks = attempt.answers.reduce(
    (sum, a) => sum + (a.marksObtained || 0),
    0
  );
  const percentage = (obtainedMarks / totalMarks) * 100;

  return db.studentQuizAttempt.update({
    where: { id: attemptId },
    data: {
      status: 'COMPLETED',
      endTime: new Date(),
      score: percentage,
    },
  });
};

const reviewQuizAttempt = async (attemptId) => {
  const attempt = await db.studentQuizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: {
        include: {
          question: true,
        },
      },
      user: {
        select: {
          profile: true,
        },
      },
      task: {
        include: {
          quizzes: {
            include: {
              questions: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Attempt not found');
  }

  if (attempt.status !== 'COMPLETED') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Attempt is not yet completed');
  }

  return attempt;
};

const listQuizzes = async (
  filters = {},
  pagination = { skip: 0, take: 10 }
) => {
  const { status, taskId, search } = filters;
  const { skip, take } = pagination;

  const where = {};

  if (status) {
    where.isActive = status === 'ACTIVE';
  }

  if (taskId) {
    where.taskId = taskId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const quizzes = await db.quiz.findMany({
    where,
    include: {
      task: true,
      createdBy: { select: { id: true, email: true, profile: true } },
      questions: true,
    },
    skip,
    take,
    orderBy: { createdAt: 'desc' },
  });

  return quizzes;
};

const getQuizById = async (quizId) => {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      task: true,
      createdBy: { select: { id: true, email: true, profile: true } },
      questions: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  return quiz;
};

const updateQuiz = async (quizId, data, userId) => {
  const existingQuiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!existingQuiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  const {
    title,
    description,
    timeLimit,
    passingScore,
    isActive,
    taskId,
    questions,
  } = data;

  const updatedQuiz = await db.quiz.update({
    where: { id: quizId },
    data: {
      title: title !== undefined ? title : existingQuiz.title,
      description:
        description !== undefined ? description : existingQuiz.description,
      timeLimit: timeLimit !== undefined ? timeLimit : existingQuiz.timeLimit,
      passingScore:
        passingScore !== undefined ? passingScore : existingQuiz.passingScore,
      isActive: isActive !== undefined ? isActive : existingQuiz.isActive,
      taskId: taskId !== undefined ? taskId : existingQuiz.taskId,
    },
    include: { questions: true },
  });

  if (questions) {
    const existingQuestionIds = existingQuiz.questions.map((q) => q.id);
    const incomingQuestionIds = questions.filter((q) => q.id).map((q) => q.id);

    const questionsToDelete = existingQuestionIds.filter(
      (id) => !incomingQuestionIds.includes(id)
    );
    if (questionsToDelete.length > 0) {
      await db.quizQuestion.deleteMany({
        where: { id: { in: questionsToDelete } },
      });
    }

    for (const question of questions) {
      if (question.id) {
        await db.quizQuestion.update({
          where: { id: question.id },
          data: {
            questionText: question.questionText,
            type: question.type,
            marks: question.marks,
            options: question.options,
            correctAnswer: question.correctAnswer,
          },
        });
      } else {
        const questionCode = await generateSystemCode('QUIZ_QUESTION');
        await db.quizQuestion.create({
          data: {
            questionText: question.questionText,
            type: question.type,
            marks: question.marks,
            orderIndex: question.orderIndex || 1,
            options: question.options,
            correctAnswer: question.correctAnswer,
            questionCode,
            quizId: quizId,
          },
        });
      }
    }
  }

  const finalQuiz = await getQuizById(quizId);

  return finalQuiz;
};

const getQuizOptions = async () => {
  const quizzes = await db.quiz.findMany({
    select: {
      id: true,
      title: true,
      quizCode: true,
      description: true,
      isActive: true,
      createdAt: true,
      createdBy: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return quizzes.map((quiz) => ({
    value: quiz.id,
    label: `${quiz.quizCode} ${quiz.title}`,
    description: quiz.description,
    createdBy:
      `${quiz.createdBy.profile?.firstName || ''} ${
        quiz.createdBy.profile?.lastName || ''
      }`.trim() || quiz.createdBy.email,
  }));
};

const quizService = {
  createQuiz,
  getQuizByTaskId,
  startQuizAttempt,
  submitQuizAnswer,
  completeQuizAttempt,
  reviewQuizAttempt,
  listQuizzes,
  getQuizOptions,
};

module.exports = quizService;
