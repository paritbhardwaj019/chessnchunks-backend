const jwt = require('jsonwebtoken');

const db = require('../database/prisma');
const logger = require('./logger');

const verifyJWTForSocket = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    'Decoded Token:', decoded;

    const user = await db.user.findUnique({
      where: { id: decoded.id },
      include: {
        studentOfBatches: true,
        coachOfBatches: true,
      },
    });

    'Database User Query Result:', user;

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (err) {
    logger.error(`JWT Verification Error: ${err.message || err}`);

    if (err.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }

    throw new Error('Invalid token');
  }
};

module.exports = { verifyJWTForSocket };
