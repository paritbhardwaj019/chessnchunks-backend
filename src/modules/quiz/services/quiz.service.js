const { SYSTEM_CODE_MODULE, QUESTION_TYPE } = require('@prisma/client');
const httpStatus = require('http-status');
const db = require('../../../database/prisma');
const ApiError = require('../../../utils/apiError');
const generateSystemCode = require('../../../utils/generateSystemCode');
const logger = require('../../../utils/logger');

const questionTypeMapping = {
  mcq: 'MULTIPLE_CHOICE',
  'true-false': 'TRUE_FALSE',
  'fill-blanks': 'FILL_IN_THE_BLANKS',
  'short-answer': 'SHORT_ANSWER',
  'long-answer': 'LONG_ANSWER',
};

const createQuiz = async (data, userId) => {
  const { title, description, timeLimit, passingScore, taskId, questions } =
    data;

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    throw new Error('At least one question is required to create a quiz.');
  }

  const quiz = await db.$transaction(async (prisma) => {
    const quizCode = await generateSystemCode(SYSTEM_CODE_MODULE.QUIZ);

    const mappedQuestions = [];
    for (let index = 0; index < questions.length; index++) {
      const q = questions[index];
      const questionCode = await generateSystemCode(
        SYSTEM_CODE_MODULE.QUIZ_QUESTION
      );

      const mappedType = questionTypeMapping[q.type] || q.type;

      mappedType;

      if (!Object.values(QUESTION_TYPE).includes(mappedType)) {
        throw new Error(`Invalid question type: ${mappedType}`);
      }

      const questionData = {
        questionText: q.questionText,
        type: mappedType,
        marks: q.marks,
        orderIndex: index + 1,
        questionCode,
        correctAnswer: q.correctAnswer,
        options: [],
      };

      if (['MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(mappedType)) {
        if (!Array.isArray(q.options) || q.options.length < 2) {
          throw new Error(
            `Question ${
              index + 1
            }: At least two options are required for ${mappedType} type.`
          );
        }
        questionData.options = q.options;
      }

      if (
        ['FILL_IN_THE_BLANKS', 'SHORT_ANSWER', 'LONG_ANSWER'].includes(
          mappedType
        )
      ) {
        if (!q.wordLimit || q.wordLimit < 1) {
          throw new Error(
            `Question ${index + 1}: Word limit must be at least 1.`
          );
        }
        questionData.wordLimit = q.wordLimit;
      }

      mappedQuestions.push(questionData);
    }

    const createdQuiz = await prisma.quiz.create({
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

    return createdQuiz;
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
      task: {
        include: {
          studentQuizAttempts: true,
        },
      },
    },
  });

  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found for this task');
  }
  return quiz;
};

const startQuizAttempt = async (quizId, userId) => {
  const existingAttempt = await db.studentQuizAttempt.findFirst({
    where: {
      userId,
      quizId,
      status: 'IN_PROGRESS',
    },
  });

  if (existingAttempt) {
    return null;
  }

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: { task: true },
  });

  if (!quiz?.task) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Quiz is not assigned to any active task'
    );
  }

  return db.studentQuizAttempt.create({
    data: {
      taskId: quiz.task.id,
      quizId,
      userId,
      startTime: new Date(),
      status: 'IN_PROGRESS',
    },
    include: {
      quiz: { include: { questions: true } },
      user: { include: { profile: true } },
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

const completeQuizAttempt = async (attemptId, answers) => {
  return db.$transaction(async (prisma) => {
    const attempt = await prisma.studentQuizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: { include: { questions: true } },
      },
    });

    if (!attempt || attempt.status === 'COMPLETED') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid quiz attempt');
    }

    const totalMarks = attempt.quiz.questions.reduce(
      (sum, q) => sum + q.marks,
      0
    );
    let obtainedMarks = 0;

    const answerRecords = answers.map((answer) => {
      const question = attempt.quiz.questions.find(
        (q) => q.id === answer.questionId
      );
      if (!question) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Invalid question ID: ${answer.questionId}`
        );
      }

      // Convert both answers to lowercase strings for comparison
      const studentAnswer = String(answer.answerText).toLowerCase();
      const correctAnswer = String(question.correctAnswer).toLowerCase();

      // Check if answers match exactly, including when both are "false"
      const isCorrect = studentAnswer === correctAnswer;
      const marks = isCorrect ? question.marks : 0;
      obtainedMarks += marks;

      return {
        attemptId,
        questionId: answer.questionId,
        answerText: answer.answerText,
        isCorrect,
        marksObtained: marks,
      };
    });

    await prisma.studentQuizAnswer.createMany({
      data: answerRecords,
    });

    const percentageScore = (obtainedMarks / totalMarks) * 100;

    return prisma.studentQuizAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        obtainedMarks,
        totalMarks,
        score: percentageScore,
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    });
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
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const quizzes = await db.quiz.findMany({
    where,
    include: {
      task: {
        include: {
          assignedToAcademy: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedToUser: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          assignedToBatch: {
            select: {
              id: true,
              batchCode: true,
              academy: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          profile: true,
        },
      },
      questions: true,
    },
    skip,
    take,
    orderBy: { createdAt: 'desc' },
  });

  const formattedQuizzes = quizzes.map((quiz) => {
    const { task, ...quizData } = quiz;

    let assignmentInfo = {
      assignedType: 'Not Assigned',
      assignedTo: '-',
    };

    if (task) {
      if (task.assignedToUserId && task.assignedToUser) {
        assignmentInfo = {
          assignedType: 'Student',
          assignedTo: `${task.assignedToUser.profile.firstName} ${task.assignedToUser.profile.lastName}`,
        };
      } else if (task.assignedToBatchId && task.assignedToBatch) {
        assignmentInfo = {
          assignedType: 'Batch',
          assignedTo: `${task.assignedToBatch.batchCode}`,
        };
      } else if (task.assignedToAcademyId && task.assignedToAcademy) {
        assignmentInfo = {
          assignedType: 'Academy',
          assignedTo: task.assignedToAcademy.name,
        };
      }
    }

    return {
      ...quizData,
      task,
      assignmentInfo,
    };
  });

  return formattedQuizzes;
};

const getQuizById = async (quizId, userId = null) => {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      task: {
        include: {
          assignedToAcademy: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedToUser: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          assignedToBatch: {
            select: {
              id: true,
              batchCode: true,
              academy: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          profile: true,
        },
      },
      questions: {
        orderBy: { orderIndex: 'asc' },
        include: {
          studentAnswers: {
            where: userId ? { attempt: { userId } } : undefined,
            include: {
              attempt: {
                include: {
                  user: {
                    include: {
                      profile: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      studentQuizAttempts: {
        where: userId ? { userId } : undefined,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          answers: {
            include: {
              question: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  const totalMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);
  const totalAttempts = quiz.studentQuizAttempts.length;

  const averageScore =
    totalAttempts > 0
      ? quiz.studentQuizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) /
        totalAttempts
      : 0;

  const formattedQuiz = {
    ...quiz,
    statistics: {
      totalQuestions: quiz.questions.length,
      totalMarks,
      passingScore: quiz.passingScore,
      totalAttempts,
      averageScore: parseFloat(averageScore.toFixed(2)),
    },
    attempts: quiz.studentQuizAttempts.map((attempt) => ({
      ...attempt,
      percentage: parseFloat(
        ((attempt.obtainedMarks / attempt.totalMarks) * 100).toFixed(2)
      ),
      isPassed:
        (attempt.obtainedMarks / attempt.totalMarks) * 100 >= quiz.passingScore,
      duration: attempt.endTime
        ? Math.round(
            (new Date(attempt.endTime).getTime() -
              new Date(attempt.startTime).getTime()) /
              60000
          )
        : null,
    })),
    questions: quiz.questions.map((question) => ({
      ...question,
      studentAnswers: question.studentAnswers.map((answer) => ({
        ...answer,
        isCorrect: answer.isCorrect,
        marksObtained: answer.marksObtained,
        student: answer.attempt.user.profile,
        attemptId: answer.attemptId,
      })),
    })),
  };

  return formattedQuiz;
};

const updateQuiz = async (quizId, data) => {
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

  await db.quiz.update({
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

const assignQuizWithTask = async (data, loggedInUser) => {
  const {
    quizId,
    description,
    startDate,
    endDate,
    status,
    assignmentType,
    assigneeId,
  } = data;

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: {
          orderIndex: 'asc',
        },
      },
    },
  });

  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  const taskId = await generateSystemCode(SYSTEM_CODE_MODULE.TASK);

  const taskData = {
    description: description || `Quiz Assignment: ${quiz.title}`,
    taskId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    status,
    createdById: loggedInUser.id,
    quizzes: {
      connect: { id: quizId },
    },
  };

  switch (assignmentType) {
    case 'student': {
      if (!assigneeId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Student ID is required');
      }
      const user = await db.user.findUnique({
        where: { id: assigneeId },
        include: {
          profile: true,
        },
      });
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
      }
      taskData.assignedToUserId = assigneeId;
      break;
    }

    case 'batch': {
      if (!assigneeId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Batch ID is required');
      }
      const batch = await db.batch.findFirst({
        where: {
          id: assigneeId,
        },
      });
      if (!batch) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
      }
      taskData.assignedToBatchId = assigneeId;
      break;
    }

    case 'academy': {
      if (!assigneeId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Academy ID is required');
      }
      const academy = await db.academy.findUnique({
        where: { id: assigneeId },
      });
      if (!academy) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Academy not found');
      }
      taskData.assignedToAcademyId = assigneeId;
      break;
    }

    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid assignment type');
  }

  try {
    const task = await db.task.create({
      data: taskData,
      include: {
        quizzes: true,
        assignedToUser: true,
        assignedToBatch: true,
        assignedToAcademy: true,
        createdBy: true,
      },
    });

    if (!task.quizzes || task.quizzes.length === 0) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to connect quiz to task'
      );
    }

    return task;
  } catch (error) {
    logger.error(`Error creating task: ${error.message || error}`);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create quiz assignment'
    );
  }
};

const getQuizWithResults = async (quizId) => {
  return db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { orderBy: { orderIndex: 'asc' } },
      studentQuizAttempts: {
        include: {
          user: {
            include: { profile: true },
          },
          answers: {
            include: {
              question: true,
            },
          },
        },
        orderBy: { startTime: 'desc' },
      },
    },
  });
};

const getStudentQuizAttempts = async (userId) => {
  const attempts = await db.studentQuizAttempt.findMany({
    where: {
      userId,
    },
    include: {
      task: {
        include: {
          quizzes: {
            select: {
              id: true,
              title: true,
              description: true,
              timeLimit: true,
              passingScore: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: 'desc',
    },
  });

  return attempts;
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
  assignQuizWithTask,
  getQuizById,
  getQuizWithResults,
  getStudentQuizAttempts,
  updateQuiz,
};

module.exports = quizService;
