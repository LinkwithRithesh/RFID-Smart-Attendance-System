const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

function signAccessToken(payload) {
  return jwt.sign(payload, jwtConfig.accessSecret, { expiresIn: jwtConfig.accessExpiry });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, jwtConfig.refreshSecret, { expiresIn: jwtConfig.refreshExpiry });
}

function verifyAccessToken(token) {
  return jwt.verify(token, jwtConfig.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, jwtConfig.refreshSecret);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
