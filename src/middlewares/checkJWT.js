// middlewares/checkJWT.js

const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');

const db = require('../database/prisma');

async function checkJWT(req, res, next) {
  try {
    const token = req.header('x-auth-token');

    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: 'Unauthorized access!',
        statusCode: httpStatus.UNAUTHORIZED,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await db.user.findUnique({
      where: { id: decoded.id },
      include: {
        studentOfBatches: true,
        coachOfBatches: true,
      },
    });

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: 'User not found!',
        statusCode: httpStatus.UNAUTHORIZED,
      });
    }

    req.user = user;
    req.token = token;

    next();
  } catch (err) {
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
