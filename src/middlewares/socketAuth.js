const jwt = require('jsonwebtoken');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const httpStatus = require('http-status');

const verifyJWTForSocket = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch the user from the database
    const user = await db.user.findUnique({
      where: { id: decoded.sub },
      include: {
        studentOfBatches: true,
        coachOfBatches: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (err) {
    throw new Error('Invalid token');
  }
};

module.exports = { verifyJWTForSocket };
