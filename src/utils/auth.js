// utils/auth.js

const jwt = require('jsonwebtoken');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const httpStatus = require('http-status');

const verifyJWTForSocket = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);

    // Fetch the user from the database
    const user = await db.user.findUnique({
      where: { id: decoded.id }, // Ensure this matches your token payload structure
      include: {
        studentOfBatches: true,
        coachOfBatches: true,
      },
    });

    console.log('Database User Query Result:', user);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (err) {
    console.error('JWT Verification Error:', err.message);

    if (err.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }

    throw new Error('Invalid token');
  }
};

module.exports = { verifyJWTForSocket };
    