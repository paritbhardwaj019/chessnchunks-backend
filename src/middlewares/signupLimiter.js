const rateLimit = require('express-rate-limit');

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message:
    'Too many signup attempts from this IP, please try again after 15 minutes',
});

module.exports = signupLimiter;
