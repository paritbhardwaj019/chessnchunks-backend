const jwt = require('jsonwebtoken');

/**
 * Decodes a JWT using the provided token and secret.
 *
 * @param {string} token - The JWT to decode.
 * @param {string} secret - The secret key used to verify the token.
 * @returns {Promise<object>} - The decoded payload if the token is valid.
 * @throws {Error} - If the token is invalid or verification fails.
 */

async function decodeToken(token, secret) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded);
    });
  });
}

module.exports = decodeToken;
