const { z } = require('zod');

const baseUserFields = {
  fullName: z.string().min(1, 'fullName is required'),
  email: z.string().email(),
  password: z.string().min(8, 'password must be at least 8 characters'),
  phone: z.string().max(20).optional(),
  departmentId: z.number().int().positive().optional(),
  rfidCardId: z.string().min(1).optional(),
};

// One explicit schema per role rather than a generic builder — there are
// only 10 fixed roles, and spelling each one out keeps the required/optional
// profile fields obvious instead of hidden behind a config object.
const createUserSchema = z.object({
  body: z.discriminatedUnion('role', [
    z.object({
      ...baseUserFields,
      role: z.literal('STUDENT'),
      profile: z.object({
        rollNumber: z.string().min(1),
        courseId: z.number().int().positive(),
        currentSemester: z.number().int().min(1).max(12),
        admissionYear: z.number().int().min(2000).max(2100),
        parentName: z.string().max(150).optional(),
        parentPhone: z.string().max(20).optional(),
        address: z.string().max(255).optional(),
      }),
    }),
    z.object({
      ...baseUserFields,
      role: z.literal('FACULTY'),
      profile: z.object({
        employeeId: z.string().min(1),
        designation: z.string().optional(),
        joiningDate: z.string().datetime().optional(),
      }),
    }),
    z.object({
      ...baseUserFields,
      role: z.literal('HOD'),
      profile: z.object({
        employeeId: z.string().min(1),
        departmentId: z.number().int().positive(),
        appointedDate: z.string().datetime().optional(),
      }),
    }),
    z.object({
      ...baseUserFields,
      role: z.literal('DEAN'),
      profile: z.object({
        employeeId: z.string().min(1),
        appointedDate: z.string().datetime().optional(),
      }),
    }),
    z.object({
      ...baseUserFields,
      role: z.literal('ADMINISTRATOR'),
      profile: z.object({
        employeeId: z.string().min(1),
      }),
    }),
    z.object({
      ...baseUserFields,
      role: z.literal('OFFICE_STAFF'),
      profile: z.object({
        employeeId: z.string().min(1),
        deskLocation: z.string().optional(),
      }),
    }),
    z.object({
      ...baseUserFields,
      role: z.literal('LAB_ASSISTANT'),
      profile: z.object({
        employeeId: z.string().min(1),
        labName: z.string().optional(),
      }),
    }),
    z.object({
      ...baseUserFields,
      role: z.literal('SECURITY'),
      profile: z.object({
        employeeId: z.string().min(1),
        shift: z.string().optional(),
        postLocation: z.string().optional(),
      }),
    }),
    z.object({
      ...baseUserFields,
      role: z.literal('HOUSEKEEPING'),
      profile: z.object({
        employeeId: z.string().min(1),
        shift: z.string().optional(),
        zone: z.string().optional(),
      }),
    }),
    z.object({
      ...baseUserFields,
      role: z.literal('MAINTENANCE'),
      profile: z.object({
        employeeId: z.string().min(1),
        shift: z.string().optional(),
        specialization: z.string().optional(),
      }),
    }),
  ]),
});

const updateUserSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z
    .object({
      fullName: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().max(20).nullable().optional(),
      departmentId: z.number().int().positive().nullable().optional(),
      rfidCardId: z.string().min(1).nullable().optional(),
      isActive: z.boolean().optional(),
      profile: z
        .object({
          rollNumber: z.string().min(1).optional(),
          courseId: z.number().int().positive().optional(),
          currentSemester: z.number().int().min(1).max(12).optional(),
          admissionYear: z.number().int().min(2000).max(2100).optional(),
          parentName: z.string().max(150).nullable().optional(),
          parentPhone: z.string().max(20).nullable().optional(),
          address: z.string().max(255).nullable().optional(),
        })
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    role: z.string().optional(),
    departmentId: z.coerce.number().int().positive().optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

const userIdParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
  userIdParamSchema,
};
