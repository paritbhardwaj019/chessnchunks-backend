const ChessWebAPI = require('chess-web-api');
const httpStatus = require('http-status');
const db = require('../../../database/prisma');
const ApiError = require('../../../utils/apiError');
const logger = require('../../../utils/logger');

const chess = new ChessWebAPI();

const getAcademyGoalsReport = async (academyId, filters = {}) => {
  // Get all students in the academy with their batch assignments
  const students = await db.user.findMany({
    where: {
      assignedToAcademyId: academyId,
      status: 'ACTIVE',
    },
    include: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
          chessComId: true,
        },
      },
      studentOfBatches: {
        select: {
          batchCode: true,
          currentLevel: true,
        },
      },
    },
  });

  if (!students.length) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'No students found in this academy'
    );
  }

  // Fetch chess.com stats for all students
  const studentsStats = await Promise.all(
    students.map(async (student) => {
      try {
        if (!student.profile?.chessComId) {
          return {
            batchCode: student.studentOfBatches[0]?.batchCode || 'Unassigned',
            studentName: `${student.profile?.firstName} ${student.profile?.lastName}`,
            error: 'No Chess.com ID',
          };
        }

        const stats = await chess.getPlayerStats(student.profile.chessComId);
        const monthlyArchives = await chess.getPlayerCompleteMonthlyArchives(
          student.profile.chessComId,
          new Date().getFullYear(),
          new Date().getMonth() + 1
        );

        // Calculate weekly games
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weeklyGames = monthlyArchives.body.games.filter((game) => {
          const gameDate = new Date(game.end_time * 1000);
          return gameDate >= oneWeekAgo && game.time_class === 'rapid';
        });

        return {
          batchCode: student.studentOfBatches[0]?.batchCode || 'Unassigned',
          studentName: `${student.profile.firstName} ${student.profile.lastName}`,
          chessComId: student.profile.chessComId,

          // Rapid Ratings
          rapidGoal: {
            weeklyGames: weeklyGames.length,
            rating: {
              current: stats.body.chess_rapid?.last?.rating || 0,
              high: 1700, // These could be made configurable
              mid: 1500,
              low: 1300,
            },
            accuracy: calculateAverageAccuracy(weeklyGames),
          },

          // Puzzle Stats
          puzzleGoal: {
            weeklyCount: stats.body.tactics?.recent_results?.length || 0,
            rating: {
              current: stats.body.tactics?.highest?.rating || 0,
              high: 2500,
              floor: 2300,
            },
          },

          // Puzzle Rush
          puzzleRush: {
            weeklyAttempts: 7, // Fixed as per your image
            scores: {
              high: stats.body.puzzle_rush?.best?.score || 0,
              recent: stats.body.puzzle_rush?.daily?.score || 0,
            },
          },

          // Pass Rates
          passRates: {
            standard: 60, // Fixed as per your image
            rating: 55, // Fixed as per your image
          },
        };
      } catch (error) {
        logger.error(
          `Error fetching Chess.com stats for ${student.profile?.firstName} ${student.profile?.lastName}: ${error.message}`
        );
        return {
          batchCode: student.studentOfBatches[0]?.batchCode || 'Unassigned',
          studentName: `${student.profile?.firstName} ${student.profile?.lastName}`,
          error: 'Failed to fetch Chess.com stats',
        };
      }
    })
  );

  let filteredStats = studentsStats;
  if (filters.type) {
    switch (filters.type) {
      case 'Games':
        filteredStats = studentsStats.map((stat) => ({
          batchCode: stat.batchCode,
          studentName: stat.studentName,
          weeklyGoal: 15,
          weeklyGames: stat.rapidGoal?.weeklyGames || 0,
          ratings: {
            high: stat.rapidGoal?.rating?.high || 0,
            mid: stat.rapidGoal?.rating?.mid || 0,
            low: stat.rapidGoal?.rating?.low || 0,
            current: stat.rapidGoal?.rating?.current || 0,
          },
          accuracy: stat.rapidGoal?.accuracy || 0,
        }));
        break;

      case 'Puzzles':
        filteredStats = studentsStats.map((stat) => ({
          batchCode: stat.batchCode,
          studentName: stat.studentName,
          weeklyGoal: 75,
          puzzleSolved: stat.puzzleGoal?.weeklyCount || 0,
          ratings: {
            high: stat.puzzleGoal?.rating?.high || 0,
            current: stat.puzzleGoal?.rating?.current || 0,
            floor: stat.puzzleGoal?.rating?.floor || 0,
          },
        }));
        break;

      case 'Puzzle Rushes':
        filteredStats = studentsStats.map((stat) => ({
          batchCode: stat.batchCode,
          studentName: stat.studentName,
          weeklyAttempts: stat.puzzleRush?.weeklyAttempts || 0,
          scores: {
            high: stat.puzzleRush?.scores?.high || 0,
            recent: stat.puzzleRush?.scores?.recent || 0,
          },
        }));
        break;
    }
  }

  return {
    students: filteredStats,
    filters: {
      type: filters.type || 'All',
      view: filters.view || 'Both',
    },
  };
};

const calculateAverageAccuracy = (games) => {
  if (!games.length) return 0;
  const accuracySum = games.reduce(
    (sum, game) => sum + (game.accuracies?.white || 0),
    0
  );
  return (accuracySum / games.length).toFixed(2);
};

const academyGoalsService = {
  getAcademyGoalsReport,
};

module.exports = academyGoalsService;
