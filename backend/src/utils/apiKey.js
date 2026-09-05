const crypto = require('crypto');
const bcrypt = require('bcrypt');

const API_KEY_BYTES = 32;
const API_KEY_SALT_ROUNDS = 10;

function generateApiKey() {
  return crypto.randomBytes(API_KEY_BYTES).toString('hex');
}

function hashApiKey(apiKey) {
  return bcrypt.hash(apiKey, API_KEY_SALT_ROUNDS);
}

function compareApiKey(apiKey, hash) {
  return bcrypt.compare(apiKey, hash);
}

module.exports = { generateApiKey, hashApiKey, compareApiKey };
