const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const formatNumberWithPrefix = require('../utils/formatNumberWithPrefix');
const FPDF = require('node-fpdf');

const createSeasonalGoalHandler = async (data) => {
  const { startDate, endDate, batchId } = data;

  const newStartDate = new Date(startDate);
  const newEndDate = new Date(endDate);

  const seasonalGoalCount = await db.seasonalGoal.count({
    where: {
      batch: {
        id: batchId,
      },
    },
  });

  const seasonalCode = formatNumberWithPrefix('SG', seasonalGoalCount);

  const createdSeasonalGoal = await db.seasonalGoal.create({
    data: {
      startDate: newStartDate,
      endDate: newEndDate,
      batch: {
        connect: {
          id: batchId,
        },
      },
      code: seasonalCode,
    },
  });

  return createdSeasonalGoal;
};

const createMonthlyGoalHandler = async (data) => {
  const { seasonalGoalId, startDate, endDate, batchId } = data;

  const newStartDate = new Date(startDate);
  const newEndDate = new Date(endDate);

  const monthlyGoalCount = await db.monthlyGoal.count({
    where: {
      seasonalGoal: {
        id: seasonalGoalId,
      },
    },
  });

  const monthlyGoalCode = formatNumberWithPrefix('MG', monthlyGoalCount);

  const createdMonthlyGoal = await db.monthlyGoal.create({
    data: {
      seasonalGoal: {
        connect: {
          id: seasonalGoalId,
        },
      },
      startDate: newStartDate,
      endDate: newEndDate,
      code: monthlyGoalCode,
      batch: {
        connect: {
          id: batchId,
        },
      },
    },
  });

  return createdMonthlyGoal;
};

const getSeasonalGoalsForOptions = async (batchId) => {
  const seasonalGoals = await db.seasonalGoal.findMany({
    where: {
      batchId,
    },
    select: {
      id: true,
      code: true,
    },
  });
  return seasonalGoals;
};

const getMonthlyGoalsForOptions = async (seasonalGoalId) => {
  const monthlyGoals = await db.monthlyGoal.findMany({
    where: {
      seasonalGoalId: seasonalGoalId,
    },
    select: {
      id: true,
      code: true,
    },
  });
  return monthlyGoals;
};

const createWeeklyGoalHandler = async (data) => {
  const {
    monthlyGoalId,
    startDate,
    endDate,
    noOfGames,
    minReviews,
    midReviews,
    maxReviews,
    batchId,
  } = data;

  const newStartDate = new Date(startDate);
  const newEndDate = new Date(endDate);

  const weeklyGoalCount = await db.weeklyGoal.count({
    where: {
      monthlyGoal: {
        id: monthlyGoalId,
      },
    },
  });

  const weeklyGoalCode = formatNumberWithPrefix('WG', weeklyGoalCount);

  const createdWeeklyGoal = await db.weeklyGoal.create({
    data: {
      startDate: newStartDate,
      endDate: newEndDate,
      monthlyGoal: {
        connect: {
          id: monthlyGoalId,
        },
      },
      target: {
        create: {
          noOfGames: parseInt(noOfGames, 10),
          minReviews: parseInt(minReviews, 10),
          maxReviews: parseInt(midReviews, 10),
          midReviews: parseInt(maxReviews, 10),
        },
      },
      code: weeklyGoalCode,
      batch: {
        connect: {
          id: batchId,
        },
      },
    },
    select: {
      target: true,
    },
  });

  return createdWeeklyGoal;
};

const assignWeeklyGoalHandler = async (data) => {
  const { weeklyGoalId, batchId } = data;

  const foundBatch = await db.batch.findUnique({
    where: { id: batchId },
    select: { students: { select: { id: true } } },
  });

  if (!foundBatch || foundBatch.students.length < 1) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'No students found in the specified batch'
    );
  }

  const allStudentsData = foundBatch.students.map((el) => ({
    studentId: el.id,
    weeklyGoalId,
  }));

  const allGoals = await db.studentWeeklyGoal.createMany({
    data: allStudentsData,
    skipDuplicates: true,
  });

  await Promise.all(
    foundBatch.students.map(async (el) => {
      const foundStudentWeeklyGoal = await db.studentWeeklyGoal.findFirst({
        where: {
          studentId: el.id,
          weeklyGoalId: weeklyGoalId,
        },
        select: { id: true },
      });

      await db.user.update({
        where: { id: el.id },
        data: {
          studentGoals: {
            connect: {
              id: foundStudentWeeklyGoal.id,
            },
          },
        },
      });
    })
  );

  return allGoals;
};

const getAllSeasonalGoalsHandler = async (page, limit, query, loggedInUser) => {
  const numberPage = Number(page) || 1;
  const numberLimit = Number(limit) || 10;
  const { batchId } = query;

  let batchFilter = {};

  if (loggedInUser.role === 'ADMIN') {
    batchFilter = {
      batch: {
        academy: {
          admins: {
            some: {
              id: loggedInUser.id,
            },
          },
        },
      },
    };
  } else if (loggedInUser.role === 'COACH') {
    batchFilter = {
      batch: {
        coaches: {
          some: {
            id: loggedInUser.id,
          },
        },
      },
    };
  } else if (loggedInUser.role === 'STUDENT') {
    batchFilter = {
      batch: {
        students: {
          some: {
            id: loggedInUser.id,
          },
        },
      },
    };
  }

  if (batchId) {
    batchFilter.batchId = batchId;
  }

  const seasonalGoals = await db.seasonalGoal.findMany({
    where: batchFilter,
    skip: (numberPage - 1) * numberLimit,
    take: numberLimit,
    include: {
      _count: {
        select: { monthlyGoals: true },
      },
    },
  });

  return seasonalGoals;
};

const getAllMonthlyGoalsHandler = async (page, limit, query, loggedInUser) => {
  const numberPage = Number(page) || 1;
  const numberLimit = Number(limit) || 10;
  const { seasonalGoalId } = query;

  let batchFilter = {};

  if (loggedInUser.role === 'ADMIN') {
    batchFilter = {
      seasonalGoal: {
        batch: {
          academy: {
            admins: {
              some: {
                id: loggedInUser.id,
              },
            },
          },
        },
      },
    };
  } else if (loggedInUser.role === 'COACH') {
    batchFilter = {
      seasonalGoal: {
        batch: {
          coaches: {
            some: {
              id: loggedInUser.id,
            },
          },
        },
      },
    };
  } else if (loggedInUser.role === 'STUDENT') {
    batchFilter = {
      seasonalGoal: {
        batch: {
          students: {
            some: {
              id: loggedInUser.id,
            },
          },
        },
      },
    };
  }

  if (seasonalGoalId) {
    batchFilter.seasonalGoalId = seasonalGoalId;
  }

  const monthlyGoals = await db.monthlyGoal.findMany({
    where: batchFilter,
    skip: (numberPage - 1) * numberLimit,
    take: numberLimit,
    include: {
      _count: {
        select: { weeklyGoals: true },
      },
    },
  });

  return monthlyGoals;
};

const getAllWeeklyGoalsHandler = async (page, limit, query, loggedInUser) => {
  const numberPage = Number(page) || 1;
  const numberLimit = Number(limit) || 10;
  const { monthlyGoalId } = query;

  let batchFilter = {};

  if (loggedInUser.role === 'ADMIN') {
    batchFilter = {
      monthlyGoal: {
        seasonalGoal: {
          batch: {
            academy: {
              admins: {
                some: {
                  id: loggedInUser.id,
                },
              },
            },
          },
        },
      },
    };
  } else if (loggedInUser.role === 'COACH') {
    batchFilter = {
      monthlyGoal: {
        seasonalGoal: {
          batch: {
            coaches: {
              some: {
                id: loggedInUser.id,
              },
            },
          },
        },
      },
    };
  } else if (loggedInUser.role === 'STUDENT') {
    batchFilter = {
      monthlyGoal: {
        seasonalGoal: {
          batch: {
            students: {
              some: {
                id: loggedInUser.id,
              },
            },
          },
        },
      },
    };
  }

  if (monthlyGoalId) {
    batchFilter.monthlyGoalId = monthlyGoalId;
  }

  const weeklyGoals = await db.weeklyGoal.findMany({
    where: batchFilter,
    skip: (numberPage - 1) * numberLimit,
    take: numberLimit,
  });

  return weeklyGoals;
};

const generateStudentPDFReport = async ({
  studentId,
  seasonId,
  currentDate,
}) => {
  const season = await db.seasonalGoal.findUnique({
    where: { id: seasonId },
    include: {
      monthlyGoals: {
        include: {
          weeklyGoals: {
            include: {
              studentGoals: {
                where: { studentId },
              },
            },
          },
        },
      },
    },
  });

  if (!season) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Season not found');
  }

  let totalGamesGoal = 0;
  let totalGamesPlayed = 0;
  let totalPuzzlesGoal = 0;
  let totalPuzzlesPlayed = 0;
  let totalPuzzlesPassed = 0;

  for (const monthlyGoal of season.monthlyGoals) {
    for (const weeklyGoal of monthlyGoal.weeklyGoals) {
      const studentGoal = weeklyGoal.studentGoals[0];

      const gamesTarget = weeklyGoal.target?.noOfGames || 0;
      const puzzlesTarget = weeklyGoal.target?.noOfPuzzles || 0;

      totalGamesGoal += gamesTarget;
      totalGamesPlayed += studentGoal ? studentGoal.gamesPlayed : 0;

      totalPuzzlesGoal += puzzlesTarget;
      totalPuzzlesPlayed += studentGoal ? studentGoal.puzzlesSolved : 0;
      totalPuzzlesPassed += studentGoal ? studentGoal.puzzlesPassed : 0;
    }
  }

  const completionPercentage = (totalGamesPlayed / totalGamesGoal) * 100 || 0;
  const puzzlePassPercentage =
    (totalPuzzlesPassed / totalPuzzlesGoal) * 100 || 0;
  const passStatus = puzzlePassPercentage >= season.minPassPercentage;

  const reportData = {
    studentId,
    seasonCode: season.code,
    totalGamesGoal,
    totalGamesPlayed,
    totalPuzzlesGoal,
    totalPuzzlesPlayed,
    totalPuzzlesPassed,
    completionPercentage: completionPercentage.toFixed(2),
    puzzlePassPercentage: puzzlePassPercentage.toFixed(2),
    passStatus: passStatus ? 'Passed' : 'Failed',
  };

  // Now, generate PDF report using FPDF (or a compatible library)// Make sure you install fpdf or use an equivalent PDF generation library
  const pdf = new FPDF('P', 'mm', 'A4');
  pdf.AddPage();

  // Add report data to PDF
  pdf.SetFont('Arial', 'B', 16);
  pdf.Cell(200, 10, 'Student Performance Report', 0, 1, 'C');

  pdf.SetFont('Arial', '', 12);
  pdf.Ln(10); // Line break
  pdf.Cell(200, 10, `Student ID: ${reportData.studentId}`, 0, 1);
  pdf.Cell(200, 10, `Season Code: ${reportData.seasonCode}`, 0, 1);
  pdf.Cell(200, 10, `Total Games Goal: ${reportData.totalGamesGoal}`, 0, 1);
  pdf.Cell(200, 10, `Total Games Played: ${reportData.totalGamesPlayed}`, 0, 1);
  pdf.Cell(200, 10, `Total Puzzles Goal: ${reportData.totalPuzzlesGoal}`, 0, 1);
  pdf.Cell(
    200,
    10,
    `Total Puzzles Played: ${reportData.totalPuzzlesPlayed}`,
    0,
    1
  );
  pdf.Cell(
    200,
    10,
    `Total Puzzles Passed: ${reportData.totalPuzzlesPassed}`,
    0,
    1
  );
  pdf.Cell(
    200,
    10,
    `Completion Percentage: ${reportData.completionPercentage}%`,
    0,
    1
  );
  pdf.Cell(
    200,
    10,
    `Puzzle Pass Percentage: ${reportData.puzzlePassPercentage}%`,
    0,
    1
  );
  pdf.Cell(200, 10, `Pass Status: ${reportData.passStatus}`, 0, 1);

  const filePath = `./reports/student_performance_report_${reportData.studentId}.pdf`;
  pdf.Output(filePath);

  return filePath;
};

const fetchAllWeeklyGoalsHandler = async (loggedInUser) => {
  const studentId = loggedInUser.id;

  const weeklyGoals = await db.studentWeeklyGoal.findMany({
    where: { studentId },
    include: {
      weeklyGoal: {
        include: {
          batch: {
            include: {
              coaches: {
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
            },
          },
        },
      },
    },
  });

  const result = weeklyGoals.map((goal) => ({
    id: goal.id,
    weeklyGoalCode: goal.weeklyGoal.code,
    startDate: goal.weeklyGoal.startDate,
    endDate: goal.weeklyGoal.endDate,
    puzzlesTarget: goal.puzzlesTarget,
    puzzlesSolved: goal.puzzlesSolved,
    puzzlesPassed: goal.puzzlesPassed,
    isCustom: goal.isCustom,
    assignedBy: goal.weeklyGoal.batch.coaches.map((coach) => ({
      id: coach.id,
      firstName: coach.profile?.firstName,
      lastName: coach.profile?.lastName,
    })),
  }));

  return result;
};

const getWeeklyGoalsForOptions = async (batchId, monthlyGoalId) => {
  const whereClause = {};

  console.log(batchId, monthlyGoalId);

  if (batchId && monthlyGoalId) {
    whereClause.batchId = batchId;
    whereClause.monthlyGoalId = monthlyGoalId;
  } else if (batchId) {
    whereClause.batchId = batchId;
  } else if (monthlyGoalId) {
    whereClause.monthlyGoalId = monthlyGoalId;
  }

  const weeklyGoals = await db.weeklyGoal.findMany({
    where: whereClause,
    select: {
      id: true,
      code: true,
    },
  });

  return weeklyGoals;
};

module.exports = {
  createSeasonalGoalHandler,
  createMonthlyGoalHandler,
  createWeeklyGoalHandler,
  assignWeeklyGoalHandler,
  getAllSeasonalGoalsHandler,
  getAllMonthlyGoalsHandler,
  getAllWeeklyGoalsHandler,
  generateStudentPDFReport,
  fetchAllWeeklyGoalsHandler,
  getSeasonalGoalsForOptions,
  getMonthlyGoalsForOptions,
  getWeeklyGoalsForOptions,
};
