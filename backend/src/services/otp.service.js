const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Generates a 6-digit OTP, hashes it, and upserts into `otp_verifications` keyed by email.
 */
async function generateAndStoreOtp(email, payload) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, BCRYPT_SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const payloadJson = JSON.stringify(payload);

  await prisma.otpVerification.upsert({
    where: { email },
    update: {
      otpHash,
      payloadJson,
      expiresAt,
      attempts: 0,
      consumedAt: null,
    },
    create: {
      email,
      otpHash,
      payloadJson,
      expiresAt,
      attempts: 0,
    },
  });

  return otp;
}

/**
 * Verifies an OTP against stored hash in `otp_verifications`.
 * Respects expiry, max attempts (5), and single-use (`consumedAt`).
 */
async function verifyOtp(email, inputOtp) {
  const record = await prisma.otpVerification.findUnique({
    where: { email },
  });

  if (!record || record.consumedAt) {
    throw new ApiError(400, 'Invalid OTP.');
  }

  if (new Date() > record.expiresAt || record.attempts >= MAX_ATTEMPTS) {
    throw new ApiError(410, 'OTP expired.');
  }

  const isMatch = await bcrypt.compare(inputOtp, record.otpHash);
  if (!isMatch) {
    const updatedAttempts = record.attempts + 1;
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { attempts: updatedAttempts },
    });

    if (updatedAttempts >= MAX_ATTEMPTS) {
      throw new ApiError(410, 'OTP expired.');
    }

    throw new ApiError(400, 'Invalid OTP.');
  }

  // Mark consumed and return original registration payload
  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  return JSON.parse(record.payloadJson);
}

module.exports = {
  generateAndStoreOtp,
  verifyOtp,
};
