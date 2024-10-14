// middlewares/checkJWT.js

const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');

async function checkJWT(req, res, next) {
  try {
    const token = req.header('x-auth-token');

    console.log('TOKEN', token);

    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: 'Unauthorized access!',
        statusCode: httpStatus.UNAUTHORIZED,
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);

    // Fetch the user from the database using decoded.id
    const user = await db.user.findUnique({
      where: { id: decoded.id }, // Ensure this matches your token payload structure
      include: {
        studentOfBatches: true,
        coachOfBatches: true,
      },
    });

    console.log('Database User Query Result:', user);

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: 'User not found!',
        statusCode: httpStatus.UNAUTHORIZED,
      });
    }

    // Attach user and token to the request object
    req.user = user;
    req.token = token;

    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);

    // Handle specific JWT errors
    if (err.name === 'TokenExpiredError') {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: 'Token has expired!',
        statusCode: httpStatus.UNAUTHORIZED,
      });
    }

    return res.status(httpStatus.UNAUTHORIZED).json({
      message: 'Invalid token!',
      statusCode: httpStatus.UNAUTHORIZED,
    });
  }
}

module.exports = checkJWT;
