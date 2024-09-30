const httpStatus = require('http-status');

async function checkJWT(req, res, next) {
  const token = req.header('x-auth-token') ? req.header('x-auth-token') : null;

  if (!token)
    return res.status(httpStatus.UNAUTHORIZED).json({
      message: 'Unauthorized access!',
      statusCode: httpStatus.UNAUTHORIZED,
    });

  req.token = token;

  next();
}

module.exports = checkJWT;
