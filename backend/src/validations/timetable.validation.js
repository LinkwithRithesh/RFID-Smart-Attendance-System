const { z } = require('zod');

const DAY_ENUM = z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);

const createTimetableSchema = z.object({
  body: z.object({
    subjectId: z.number().int().positive(),
    facultyId: z.number().int().positive(),
    departmentId: z.number().int().positive(),
    roomNumber: z.string().optional(),
    dayOfWeek: DAY_ENUM,
    startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'expected HH:MM or HH:MM:SS'),
    endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'expected HH:MM or HH:MM:SS'),
    semester: z.number().int().min(1).max(12),
    academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'expected YYYY-YYYY'),
  }),
});

const updateTimetableSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z
    .object({
      roomNumber: z.string().optional(),
      dayOfWeek: DAY_ENUM.optional(),
      startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
      endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
      facultyId: z.number().int().positive().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' }),
});

const timetableIdParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

const listTimetableQuerySchema = z.object({
  query: z.object({
    departmentId: z.coerce.number().int().positive().optional(),
    facultyId: z.coerce.number().int().positive().optional(),
    dayOfWeek: DAY_ENUM.optional(),
  }),
});

module.exports = {
  createTimetableSchema,
  updateTimetableSchema,
  timetableIdParamSchema,
  listTimetableQuerySchema,
};
