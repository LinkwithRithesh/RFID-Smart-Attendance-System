const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    email: z.string().optional(),
    loginId: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
  }).refine((data) => !!(data.email || data.loginId), {
    message: 'Email or User ID is required',
    path: ['email'],
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'refreshToken is required'),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    otp: z.string().min(6, 'OTP must be 6 characters').max(6, 'OTP must be 6 characters'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});

module.exports = { loginSchema, refreshSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema };
