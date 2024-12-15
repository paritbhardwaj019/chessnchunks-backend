const { mysqlPool } = require('../config/db');
const httpStatus = require('http-status');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

const getStudentPerformanceHandler = async (filters = {}) => {
  try {
    const { studentId, timeframe = 'weekly', batchId, academyId } = filters;

    console.log('FILTERS', filters);

    let dateFilter = getDateFilterByTimeframe(timeframe);

    const query = `
      SELECT 
        u.id as userId,
        p.firstName,
        p.lastName,
        p.chessComId,
        cs.RapidLastRating,
        cs.RapidBest,
        cs.RapidWin + cs.RapidLoss + cs.RapidDraw as totalGames,
        cs.RapidWin as wins,
        cs.RapidLoss as losses,
        cs.RapidDraw as draws,
        ROUND((cs.RapidWin / NULLIF(cs.RapidWin + cs.RapidLoss + cs.RapidDraw, 0)) * 100, 2) as winRate,
        cs.RapidDifference as ratingChange,
        cs.TacticsHighestRating,
        cs.RushBestScore,
        cs.CreatedDate as lastUpdated,
        b.batchCode,
        b.currentClass,
        b.currentLevel
      FROM users u
      JOIN profiles p ON u.id = p.userId
      JOIN user_chess_stats cs ON u.code = cs.UserId
      JOIN _BatchStudents bs ON u.id = bs.B
      JOIN batches b ON bs.A = b.id
      WHERE 1=1
      ${studentId ? 'AND u.id = ?' : ''}
      ${batchId ? 'AND b.id = ?' : ''}
      ${dateFilter}
      ORDER BY cs.RapidLastRating DESC
    `;

    const queryParams = [
      ...(studentId ? [studentId] : []),
      ...(batchId ? [batchId] : []),
    ];

    const [results] = await mysqlPool.query(query, queryParams);

    console.log('RESULTS', results);

    return results.map((student) => ({
      studentInfo: {
        id: student.userId,
        name: `${student.firstName} ${student.lastName}`,
        chessComId: student.chessComId,
        batch: student.batchCode,
        class: student.currentClass,
        level: student.currentLevel,
      },
      ratings: {
        current: student.RapidLastRating,
        best: student.RapidBest,
        tactics: student.TacticsHighestRating,
        puzzleRush: student.RushBestScore,
      },
      performance: {
        totalGames: student.totalGames,
        wins: student.wins,
        losses: student.losses,
        draws: student.draws,
        winRate: student.winRate,
        ratingChange: student.ratingChange,
      },
      lastUpdated: student.lastUpdated,
    }));
  } catch (error) {
    logger.error('Error in getStudentPerformanceHandler:', error);
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
      return 'AND cs.CreatedDate >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
    case 'monthly':
      return 'AND cs.CreatedDate >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    case 'seasonal':
      return 'AND cs.CreatedDate >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
    default:
      return 'AND cs.CreatedDate >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
  }
};

const studentReportService = {
  getStudentPerformanceHandler,
  getStudentProgressHandler,
  getStudentComparisonHandler,
};

module.exports = studentReportService;
