const { mysqlPool } = require('../config/db');
const httpStatus = require('http-status');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

const getStudentPerformanceHandler = async (filters = {}) => {
  try {
    const { academyId, studentId, batchId, searchQuery } = filters;

    const studentsQuery = `
      SELECT 
        u.id as userId,
        p.firstName,
        p.lastName,
        p.chessComId,
        b.batchCode,
        b.currentClass,
        b.currentLevel,
        a.name as academyName
      FROM users u
      JOIN roles r ON u.roleId COLLATE utf8mb4_unicode_ci = r.id COLLATE utf8mb4_unicode_ci
      LEFT JOIN profiles p ON u.id COLLATE utf8mb4_unicode_ci = p.userId COLLATE utf8mb4_unicode_ci
      LEFT JOIN _BatchStudents bs ON u.id COLLATE utf8mb4_unicode_ci = bs.B COLLATE utf8mb4_unicode_ci
      LEFT JOIN batches b ON bs.A COLLATE utf8mb4_unicode_ci = b.id COLLATE utf8mb4_unicode_ci
      LEFT JOIN academies a ON b.academyId COLLATE utf8mb4_unicode_ci = a.id COLLATE utf8mb4_unicode_ci
      WHERE r.name COLLATE utf8mb4_unicode_ci = 'STUDENT'
      ${
        academyId
          ? 'AND (a.id COLLATE utf8mb4_unicode_ci = ? OR a.id IS NULL)'
          : ''
      }
      ${studentId ? 'AND u.id COLLATE utf8mb4_unicode_ci = ?' : ''}
      ${
        batchId
          ? 'AND (b.id COLLATE utf8mb4_unicode_ci = ? OR b.id IS NULL)'
          : ''
      }
      ${
        searchQuery
          ? 'AND (p.firstName COLLATE utf8mb4_unicode_ci LIKE ? OR p.lastName COLLATE utf8mb4_unicode_ci LIKE ? OR p.chessComId COLLATE utf8mb4_unicode_ci LIKE ?)'
          : ''
      }
      ORDER BY p.firstName COLLATE utf8mb4_unicode_ci, p.lastName COLLATE utf8mb4_unicode_ci
    `;

    const studentQueryParams = [
      ...(academyId ? [academyId] : []),
      ...(studentId ? [studentId] : []),
      ...(batchId ? [batchId] : []),
      ...(searchQuery
        ? [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]
        : []),
    ];

    const chessStatsQuery = `
      SELECT *
      FROM user_chess_stats
      ORDER BY CreatedDate DESC
    `;

    const [students] = await mysqlPool.query(studentsQuery, studentQueryParams);
    const [chessStats] = await mysqlPool.query(chessStatsQuery);

    const chessStatsMap = chessStats.reduce((acc, stat) => {
      if (
        !acc[stat.UserId] ||
        new Date(stat.CreatedDate) > new Date(acc[stat.UserId].CreatedDate)
      ) {
        acc[stat.UserId] = stat;
      }
      return acc;
    }, {});

    return students.map((student) => {
      const stats = chessStatsMap[student.userId] || {};

      return {
        studentInfo: {
          id: student.userId,
          name:
            student.firstName && student.lastName
              ? `${student.firstName} ${student.lastName}`
              : 'N/A',
          chessComId: student.chessComId || 'N/A',
          batch: student.batchCode || 'Unassigned',
          class: student.currentClass || 'N/A',
          level: student.currentLevel || 'N/A',
          academy: student.academyName || 'Unassigned',
        },
        ratings: {
          current: stats.RapidLastRating || 0,
          best: stats.RapidBest || 0,
          tactics: stats.TacticsHighestRating || 0,
          puzzleRush: stats.RushBestScore || 0,
        },
        performance: {
          totalGames:
            (stats.RapidWin || 0) +
            (stats.RapidLoss || 0) +
            (stats.RapidDraw || 0),
          wins: stats.RapidWin || 0,
          losses: stats.RapidLoss || 0,
          draws: stats.RapidDraw || 0,
          winRate: stats.RapidWin
            ? Math.round(
                (stats.RapidWin /
                  (stats.RapidWin + stats.RapidLoss + stats.RapidDraw)) *
                  100 *
                  100
              ) / 100
            : 0,
          ratingChange: stats.RapidDifference || 0,
        },
        lastUpdated: stats.CreatedDate || null,
      };
    });
  } catch (error) {
    console.log(error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error fetching student performance data'
    );
  }
};

const getStudentProgressHandler = async (studentId, timeframe = 'monthly') => {
  try {
    let dateFilter = getDateFilterByTimeframe(timeframe);

    const query = `
      SELECT 
        DATE(cs.CreatedDate) as date,
        cs.RapidLastRating,
        cs.TacticsHighestRating,
        cs.RushBestScore,
        cs.RapidWin + cs.RapidLoss + cs.RapidDraw as gamesPlayed
      FROM user_chess_stats cs
      WHERE cs.UserId = (SELECT code FROM users WHERE id = ?)
      ${dateFilter}
      ORDER BY cs.CreatedDate ASC
    `;

    const [results] = await mysqlPool.query(query, [studentId]);

    return {
      timeframe,
      progressData: results.map((record) => ({
        date: record.date,
        ratings: {
          rapid: record.RapidLastRating,
          tactics: record.TacticsHighestRating,
          puzzleRush: record.RushBestScore,
        },
        activity: {
          gamesPlayed: record.gamesPlayed,
        },
      })),
    };
  } catch (error) {
    logger.error('Error in getStudentProgressHandler:', error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error fetching student progress data'
    );
  }
};

const getStudentComparisonHandler = async (studentId, batchId) => {
  try {
    const query = `
      WITH StudentStats AS (
        SELECT 
          RapidLastRating,
          TacticsHighestRating,
          RushBestScore
        FROM user_chess_stats cs
        JOIN users u ON cs.UserId = u.code
        WHERE u.id = ?
        ORDER BY cs.CreatedDate DESC
        LIMIT 1
      ),
      BatchStats AS (
        SELECT 
          AVG(cs.RapidLastRating) as avgRating,
          AVG(cs.TacticsHighestRating) as avgTactics,
          AVG(cs.RushBestScore) as avgRush,
          MAX(cs.RapidLastRating) as maxRating,
          MAX(cs.TacticsHighestRating) as maxTactics,
          MAX(cs.RushBestScore) as maxRush
        FROM user_chess_stats cs
        JOIN users u ON cs.UserId = u.code
        JOIN batch_students bs ON u.id = bs.userId
        WHERE bs.batchId = ?
      )
      SELECT * FROM StudentStats, BatchStats
    `;

    const [results] = await mysqlPool.query(query, [studentId, batchId]);

    if (results.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Stats not found');
    }

    const stats = results[0];
    return {
      student: {
        rapidRating: stats.RapidLastRating,
        tacticsRating: stats.TacticsHighestRating,
        rushScore: stats.RushBestScore,
      },
      batchAverages: {
        rapidRating: Math.round(stats.avgRating),
        tacticsRating: Math.round(stats.avgTactics),
        rushScore: Math.round(stats.avgRush),
      },
      batchBest: {
        rapidRating: stats.maxRating,
        tacticsRating: stats.maxTactics,
        rushScore: stats.maxRush,
      },
    };
  } catch (error) {
    logger.error('Error in getStudentComparisonHandler:', error);
    throw error;
  }
};

const getDateFilterByTimeframe = (timeframe) => {
  switch (timeframe) {
    case 'weekly':
      return 'AND (cs.CreatedDate >= DATE_SUB(NOW(), INTERVAL 1 WEEK) OR cs.CreatedDate IS NULL)';
    case 'monthly':
      return 'AND (cs.CreatedDate >= DATE_SUB(NOW(), INTERVAL 1 MONTH) OR cs.CreatedDate IS NULL)';
    case 'seasonal':
      return 'AND (cs.CreatedDate >= DATE_SUB(NOW(), INTERVAL 3 MONTH) OR cs.CreatedDate IS NULL)';
    default:
      return 'AND (cs.CreatedDate >= DATE_SUB(NOW(), INTERVAL 1 WEEK) OR cs.CreatedDate IS NULL)';
  }
};

const studentReportService = {
  getStudentPerformanceHandler,
  getStudentProgressHandler,
  getStudentComparisonHandler,
};

module.exports = studentReportService;
