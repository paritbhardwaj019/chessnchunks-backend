const httpStatus = require('http-status');

const checkSubRole = (subRoles) => (req, res, next) => {
  const { subRole } = req.user;

  if (subRole) {
    if (!subRoles.includes(subRole)) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: 'Unauthorized access!',
        statusCode: httpStatus.UNAUTHORIZED,
      });
    }
  } else {
    next();
  }
};

module.exports = checkSubRole;
