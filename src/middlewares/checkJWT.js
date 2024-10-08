const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const db = require('../database/prisma'); // Adjust the path to your Prisma client
const ApiError = require('../utils/apiError'); // Custom error handler (if you have one)

async function checkJWT(req, res, next) {
  try {
    const token = req.header('x-auth-token');

    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: 'Unauthorized access!',
        statusCode: httpStatus.UNAUTHORIZED,
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);  // Debugging output

    // Fetch the user from the database using decoded.id
    const user = await db.user.findUnique({
      where: { id: decoded.id },  // Use `decoded.id` instead of `decoded.sub`
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
    console.error('JWT Verification Error:', err.message); // Log the error for debugging

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
