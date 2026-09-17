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
    personalEmail: z.string().email('Valid personal email is required').optional(),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    otp: z.string().min(6, 'OTP must be 6 characters').max(6, 'OTP must be 6 characters'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});


const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    role: z.enum(['STUDENT', 'FACULTY']),
    fullName: z.string().min(1, 'Full name is required'),
    mobile: z.string().min(10, 'Valid mobile number is required'),
    departmentId: z.number().int().positive('Valid department is required'),
    faceFileName: z.string().min(1, 'Face registration data is required'),
    // Student specifics
    enrollmentNumber: z.string().optional(),
    courseId: z.number().optional(),
    currentSemester: z.number().optional(),
    admissionYear: z.number().optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    parentName: z.string().optional(),
    parentPhone: z.string().optional(),
    // Faculty specifics
    specialization: z.string().optional(),
  }).refine((data) => {
    if (data.role === 'STUDENT') {
      return !!data.enrollmentNumber && !!data.courseId && !!data.currentSemester && 
             !!data.admissionYear && !!data.dob && !!data.gender && 
             !!data.parentName && !!data.parentPhone;
    }
    return true;
  }, { message: 'Missing required student fields' })
});

const verifyRegisterOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    otp: z.string().min(6).max(6),
  })
});

module.exports = { registerSchema, verifyRegisterOtpSchema,  loginSchema, refreshSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema };
