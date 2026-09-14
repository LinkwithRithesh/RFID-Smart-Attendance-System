const { z } = require('zod');

const dateRangeQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

const userIdParamSchema = z.object({
  params: z.object({ userId: z.coerce.number().int().positive() }),
  query: dateRangeQuerySchema,
});

const departmentIdParamSchema = z.object({
  params: z.object({ departmentId: z.coerce.number().int().positive() }),
  query: dateRangeQuerySchema.extend({
    role: z.string().optional(),
  }),
});

const lowAttendanceQuerySchema = z.object({
  params: z.object({ departmentId: z.coerce.number().int().positive() }),
  query: dateRangeQuerySchema.extend({
    role: z.string().optional(),
    threshold: z.coerce.number().min(0).max(100).optional(),
  }),
});

const reportFormatQuerySchema = z.object({
  params: z.object({ departmentId: z.coerce.number().int().positive() }),
  query: dateRangeQuerySchema.extend({
    role: z.string().optional(),
    format: z.enum(['pdf', 'excel']),
  }),
});

module.exports = {
  userIdParamSchema,
  departmentIdParamSchema,
  lowAttendanceQuerySchema,
  reportFormatQuerySchema,
};
