const { z } = require('zod');

const openManualSessionSchema = z.object({
  body: z.object({
    departmentId: z.number().int().positive(),
    subjectId: z.number().int().positive().optional(),
    facultyId: z.number().int().positive().optional(),
    durationMinutes: z.number().int().positive().max(480).optional(),
    isEmergency: z.boolean().optional(),
  }),
});

const sessionIdParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

module.exports = { openManualSessionSchema, sessionIdParamSchema };
