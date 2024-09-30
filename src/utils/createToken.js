const jwt = require('jsonwebtoken');

/**
 * Creates a JWT with the given payload, secret, and expiration time.
 *
 * @param {*} data - Payload to embed in the token (e.g., user info).
 * @param {string} secret - Secret key for signing the token.
 * @param {string|number} expiresIn - Token expiration time (e.g., "1h" or "2d").
 * @returns {Promise<string>} - The signed JWT
 */
async function createToken(data, secret, expiresIn) {
  const token = jwt.sign(data, secret, {
    expiresIn,
  });
  return token;
}

module.exports = createToken;
