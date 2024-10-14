const httpStatus = require('http-status');
const config = require('../config');
const db = require('../database/prisma');
const decodeToken = require('../utils/decodeToken');

const checkRole = (roles) => async (req, res, next) => {
  try {
    const token = req.token;

    const decoded = await decodeToken(token, config.jwt.secret);

    const { role, id } = decoded;
    console.log('ROLE', role);
    console.log('ID', id);

    if (!roles.includes(role)) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: 'Unauthorized access!',
        statusCode: httpStatus.UNAUTHORIZED,
      });
    }

    const user = await db.user.findUnique({
      where: {
        id: id,
      },
      select: {
        email: true,
        id: true,
        role: true,
        subRole: true,
      },
    });

    console.log('DB USER', user);

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'User not found!',
        statusCode: httpStatus.NOT_FOUND,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Internal Server Error',
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
    });
  }
};

module.exports = checkRole;
