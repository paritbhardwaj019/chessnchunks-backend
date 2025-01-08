const db = require('../database/prisma');
const httpStatus = require('http-status');
const ApiError = require('../utils/apiError');
const { mysqlPool } = require('../config/db');

/**
 * Service to fetch dashboard data for Super Admins.
 * @param {Object} loggedInUser - The user object of the logged-in Super Admin.
 * @returns {Object} - Aggregated dashboard data.
 */
async function getSuperAdminDashboardData(loggedInUser) {
  if (loggedInUser.role !== 'SUPER_ADMIN') {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Access denied. Only Super Admins can access this data.'
    );
  }

  const totalAcademies = await db.academy.count({
    where: {
      isDefault: false,
    },
  });
  const totalBatches = await db.batch.count();
  const totalStudents = await db.user.count({
    where: {
      role: {
        name: 'STUDENT',
      },
    },
  });
  const totalCoaches = await db.user.count({
    where: {
      role: {
        name: 'COACH',
      },
    },
  });
  const totalPendingInvitations = await db.invitation.count({
    where: {
      status: 'PENDING',
      createdById: loggedInUser.id,
    },
  });
  const totalTasks = await db.task.count();

  return {
    totalAcademies,
    totalBatches,
    totalStudents,
    totalCoaches,
    totalPendingInvitations,
    totalTasks,
  };
}

/**
 * Service to fetch dashboard data for Admins.
 * @param {Object} loggedInUser - The user object of the logged-in Admin.
 * @returns {Object} - Aggregated dashboard data.
 */
async function getAdminDashboardData(loggedInUser) {
  // Ensure the loggedInUser has the role 'ADMIN'
  if (loggedInUser.role !== 'ADMIN') {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Access denied. Only Admins can access this data.'
    );
  }

  const adminWithAcademies = await db.user.findUnique({
    where: { id: loggedInUser.id },
    select: { adminOfAcademies: { select: { id: true } } },
  });

  if (!adminWithAcademies) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Admin user not found or has no associated academies.'
    );
  }

  const academyIds = adminWithAcademies.adminOfAcademies.map((a) => a.id);

  const totalBatches = await db.batch.count({
    where: { academyId: { in: academyIds } },
  });

  const totalStudents = await db.user.count({
    where: {
      role: {
        name: 'STUDENT',
      },
      studentOfBatches: {
        some: {
          academyId: { in: academyIds },
        },
      },
    },
  });

  const totalCoaches = await db.user.count({
    where: {
      role: {
        name: 'COACH',
      },
      coachOfBatches: {
        some: {
          academyId: { in: academyIds },
        },
      },
    },
  });

  const totalPendingInvitations = await db.invitation.count({
    where: {
      status: 'PENDING',
      createdById: loggedInUser.id, // Filter by creator
    },
  });

  const totalTasks = await db.task.count({
    where: {
      assignedToAcademyId: { in: academyIds },
    },
  });

  return {
    totalBatches,
    totalStudents,
    totalCoaches,
    totalPendingInvitations,
    totalTasks,
  };
}

/**
 * Service to fetch dashboard data for Coaches.
 * @param {Object} loggedInUser - The user object of the logged-in Coach.
 * @returns {Object} - Aggregated dashboard data.
 */
async function getCoachDashboardData(loggedInUser) {
  // Ensure the loggedInUser has the role 'COACH'
  if (loggedInUser.role !== 'COACH') {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Access denied. Only Coaches can access this data.'
    );
  }

  const coachWithBatches = await db.user.findUnique({
    where: { id: loggedInUser.id },
    select: { coachOfBatches: { select: { id: true } } },
  });

  if (!coachWithBatches) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Coach user not found or has no associated batches.'
    );
  }

  const batchIds = coachWithBatches.coachOfBatches.map((b) => b.id);

  const totalBatches = batchIds.length;

  const totalStudents = await db.user.count({
    where: {
      role: {
        name: 'STUDENT',
      },
      studentOfBatches: { some: { id: { in: batchIds } } },
    },
  });

  const totalPendingInvitations = await db.invitation.count({
    where: {
      status: 'PENDING',
      createdById: loggedInUser.id, // Filter by creator
    },
  });

  const totalTasks = await db.task.count({
    where: {
      OR: [
        { assignedToUserId: loggedInUser.id },
        { assignedToBatchId: { in: batchIds } },
      ],
    },
  });

  return {
    totalBatches,
    totalStudents,
    totalPendingInvitations,
    totalTasks,
  };
}

const getBatchStudentsStatsHandler = async (loggedInUser) => {
  try {
    const studentWithBatch = await db.user.findUnique({
      where: {
        id: loggedInUser.id,
      },
      include: {
        studentOfBatches: {
          where: {
            isActive: true,
          },
          include: {
            students: {
              include: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    chessComId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!studentWithBatch?.studentOfBatches?.length) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Student is not assigned to any active batch'
      );
    }

    const batch = studentWithBatch.studentOfBatches[0];
    const batchStudents = batch.students;

    const studentIds = batchStudents.map((student) => student.id);

    const chessStatsQuery = `
      SELECT 
        UserId,
        RapidLastRating,
        RapidBest,
        RapidWin,
        RapidLoss,
        RapidDraw,
        TacticsHighestRating,
        RushBestScore,
        RushTotalAttempts,
        CreatedDate as lastUpdated
      FROM user_chess_stats
      WHERE UserId IN (?)
      ORDER BY CreatedDate DESC
    `;

    const [chessStats] = await mysqlPool.query(chessStatsQuery, [studentIds]);

    const latestStatsMap = chessStats.reduce((acc, stat) => {
      if (
        !acc[stat.UserId] ||
        new Date(stat.lastUpdated) > new Date(acc[stat.UserId].lastUpdated)
      ) {
        acc[stat.UserId] = stat;
      }
      return acc;
    }, {});

    const chartData = {
      games: [],
      puzzles: [],
      puzzleRun: [],
      ratings: [],
    };

    batchStudents.forEach((student) => {
      const stats = latestStatsMap[student.id] || {};
      const studentName =
        `${student.profile?.firstName || ''} ${
          student.profile?.lastName || ''
        }`.trim() || 'N/A';

      // Games data
      const totalGames =
        (stats.RapidWin || 0) + (stats.RapidLoss || 0) + (stats.RapidDraw || 0);
      chartData.games.push({
        name: studentName,
        value: totalGames,
      });

      // Puzzles/Tactics data
      chartData.puzzles.push({
        name: studentName,
        value: stats.TacticsHighestRating || 0,
      });

      // Puzzle Run data
      chartData.puzzleRun.push({
        name: studentName,
        value: stats.RushBestScore || 0,
        attempts: stats.RushTotalAttempts || 0,
      });

      // Ratings data
      chartData.ratings.push({
        name: studentName,
        current: stats.RapidLastRating || 0,
        best: stats.RapidBest || 0,
      });
    });

    return {
      batchInfo: {
        id: batch.id,
        code: batch.batchCode,
        class: batch.currentClass,
        level: batch.currentLevel,
      },
      totalStudents: batchStudents.length,
      chartData,
      lastUpdated: Object.values(latestStatsMap)[0]?.lastUpdated || null,
    };
  } catch (error) {
    console.log(error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error fetching batch students statistics'
    );
  }
};

/**
 * Get performance statistics for students in a coach's batches
 * @param {string} loggedInUser - The ID of the coach
 * @returns {Promise<Object>} Performance statistics for the batch
 */
async function getCoachBatchPerformance(loggedInUser) {
  try {
    const coachBatches = await db.batch.findMany({
      where: {
        isActive: true,
        coaches: {
          some: {
            id: loggedInUser.id,
          },
        },
      },
      include: {
        students: {
          include: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                chessComId: true,
                dateOfBirth: true,
              },
            },
          },
        },
      },
    });

    if (!coachBatches.length) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'No active batches found for this coach'
      );
    }

    const allStudents = coachBatches.flatMap((batch) => batch.students);
    const studentIds = [...new Set(allStudents.map((student) => student.id))];

    const chessStatsQuery = `
      SELECT 
        UserId,
        RapidLastRating,
        RapidBest,
        RapidWin,
        RapidLoss,
        RapidDraw,
        TacticsHighestRating,
        RushBestScore,
        RushTotalAttempts,
        CreatedDate
      FROM user_chess_stats
      WHERE UserId IN (?)
      ORDER BY CreatedDate DESC
    `;

    const [chessStats] = await mysqlPool.query(chessStatsQuery, [studentIds]);

    const latestStatsMap = chessStats.reduce((acc, stat) => {
      if (
        !acc[stat.UserId] ||
        new Date(stat.CreatedDate) > new Date(acc[stat.UserId].CreatedDate)
      ) {
        acc[stat.UserId] = stat;
      }
      return acc;
    }, {});

    const batchStatistics = coachBatches.map((batch) => {
      const batchStudents = batch.students.map((student) => {
        const stats = latestStatsMap[student.id] || {};
        const studentName =
          `${student.profile?.firstName || ''} ${
            student.profile?.lastName || ''
          }`.trim() || 'N/A';

        const studentStats = chessStats.filter(
          (stat) => stat.UserId === student.id
        );

        // Calculate metrics
        const totalGames =
          (stats.RapidWin || 0) +
          (stats.RapidLoss || 0) +
          (stats.RapidDraw || 0);

        const winRate = totalGames > 0 ? (stats.RapidWin || 0) / totalGames : 0;

        return {
          id: student.id,
          name: studentName,
          chessComId: student.profile?.chessComId,
          metrics: {
            currentRating: stats.RapidLastRating || 0,
            bestRating: stats.RapidBest || 0,
            gamesPlayed: totalGames,
            winRate: winRate,
            puzzleRating: stats.TacticsHighestRating || 0,
            puzzleRushBest: stats.RushBestScore || 0,
            puzzleRushAttempts: stats.RushTotalAttempts || 0,
          },
          ratingHistory: studentStats
            .sort((a, b) => new Date(a.CreatedDate) - new Date(b.CreatedDate))
            .map((stat) => ({
              date: new Date(stat.CreatedDate).toISOString(),
              rating: stat.RapidLastRating || 0,
            })),
        };
      });

      // Calculate batch-level statistics
      const batchMetrics = {
        averageRating: calculateAverage(
          batchStudents.map((s) => s.metrics.currentRating)
        ),
        averageWinRate: calculateAverage(
          batchStudents.map((s) => s.metrics.winRate)
        ),
        totalGamesPlayed: batchStudents.reduce(
          (sum, s) => sum + s.metrics.gamesPlayed,
          0
        ),
        averagePuzzleRating: calculateAverage(
          batchStudents.map((s) => s.metrics.puzzleRating)
        ),
      };

      return {
        batchId: batch.id,
        batchCode: batch.batchCode,
        currentClass: batch.currentClass,
        currentLevel: batch.currentLevel,
        totalStudents: batchStudents.length,
        students: batchStudents,
        batchMetrics,
        lastUpdated:
          batchStudents.length > 0
            ? Math.max(
                ...batchStudents.map((s) =>
                  s.ratingHistory.length > 0
                    ? new Date(
                        s.ratingHistory[s.ratingHistory.length - 1].date
                      ).getTime()
                    : 0
                )
              )
            : null,
      };
    });

    return {
      totalBatches: batchStatistics.length,
      totalStudents: studentIds.length,
      batchStatistics,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Error in getCoachBatchPerformance:', error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error fetching coach batch performance data'
    );
  }
}

/**
 * Calculate average of numbers, handling zero cases
 * @param {number[]} numbers - Array of numbers
 * @returns {number} Average value
 */
function calculateAverage(numbers) {
  const validNumbers = numbers.filter((n) => n !== null && !isNaN(n));
  if (!validNumbers.length) return 0;
  return validNumbers.reduce((sum, num) => sum + num, 0) / validNumbers.length;
}

const getStudentChessStats = async (userId, startDate, endDate) => {
  try {
    const student = await db.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            chessComId: true,
          },
        },
      },
    });

    if (!student) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
    }

    let dateFilter = '';
    const queryParams = [userId];

    if (startDate && endDate) {
      dateFilter = 'AND CreatedDate BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }

    const statsQuery = `
      SELECT 
        UserId,
        RapidLastRating,
        RapidBest,
        RapidWin,
        RapidLoss,
        RapidDraw,
        TacticsHighestRating,
        RushBestScore,
        RushTotalAttempts,
        CreatedDate as lastUpdated
      FROM user_chess_stats
      WHERE UserId = ? ${dateFilter}
      ORDER BY CreatedDate DESC
    `;

    const [chessStats] = await mysqlPool.query(statsQuery, queryParams);

    if (!chessStats.length) {
      return {
        studentInfo: {
          id: student.id,
          name:
            `${student.profile?.firstName || ''} ${
              student.profile?.lastName || ''
            }`.trim() || 'N/A',
          chessComId: student.profile?.chessComId,
        },
        stats: {
          games: {
            total: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            timeline: [],
          },
          puzzles: {
            highestRating: 0,
            timeline: [],
          },
          puzzleRush: {
            bestScore: 0,
            totalAttempts: 0,
            timeline: [],
          },
          ratings: {
            current: 0,
            best: 0,
            timeline: [],
          },
        },
        lastUpdated: null,
      };
    }

    const timelineData = chessStats.map((stat) => ({
      date: stat.lastUpdated,
      rapidRating: stat.RapidLastRating || 0,
      tacticsRating: stat.TacticsHighestRating || 0,
      rushScore: stat.RushBestScore || 0,
      games:
        (stat.RapidWin || 0) + (stat.RapidLoss || 0) + (stat.RapidDraw || 0),
    }));

    const latestStat = chessStats[0];

    return {
      studentInfo: {
        id: student.id,
        name:
          `${student.profile?.firstName || ''} ${
            student.profile?.lastName || ''
          }`.trim() || 'N/A',
        chessComId: student.profile?.chessComId,
      },
      stats: {
        games: {
          total:
            (latestStat.RapidWin || 0) +
            (latestStat.RapidLoss || 0) +
            (latestStat.RapidDraw || 0),
          wins: latestStat.RapidWin || 0,
          losses: latestStat.RapidLoss || 0,
          draws: latestStat.RapidDraw || 0,
          timeline: timelineData.map((data) => ({
            date: data.date,
            total: data.games,
          })),
        },
        puzzles: {
          highestRating: latestStat.TacticsHighestRating || 0,
          timeline: timelineData.map((data) => ({
            date: data.date,
            rating: data.tacticsRating,
          })),
        },
        puzzleRush: {
          bestScore: latestStat.RushBestScore || 0,
          totalAttempts: latestStat.RushTotalAttempts || 0,
          timeline: timelineData.map((data) => ({
            date: data.date,
            score: data.rushScore,
          })),
        },
        ratings: {
          current: latestStat.RapidLastRating || 0,
          best: latestStat.RapidBest || 0,
          timeline: timelineData.map((data) => ({
            date: data.date,
            rating: data.rapidRating,
          })),
        },
      },
      lastUpdated: latestStat.lastUpdated,
    };
  } catch (error) {
    throw new ApiError(
      error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Error fetching student chess statistics'
    );
  }
};

const dashboardService = {
  getSuperAdminDashboardData,
  getAdminDashboardData,
  getCoachDashboardData,
  getBatchStudentsStatsHandler,
  getCoachBatchPerformance,
  getStudentChessStats,
};

module.exports = dashboardService;
