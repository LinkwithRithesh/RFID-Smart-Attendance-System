const express = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { loginSchema, refreshSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, registerSchema, verifyRegisterOtpSchema } = require('../validations/auth.validation');

const { uploadFace } = require('../config/uploadFace');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/register/face', uploadFace.single('faceImage'), authController.uploadFace);
router.post('/register/verify-otp', validate(verifyRegisterOtpSchema), authController.verifyOtp);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authenticate, authController.me);

module.exports = router;
