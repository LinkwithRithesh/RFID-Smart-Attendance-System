const { z } = require('zod');

const markDeviceAttendanceSchema = z.object({
  body: z.object({
    rfidCardId: z.string().min(1),
  }),
});

const markManualAttendanceSchema = z.object({
  body: z.object({
    sessionId: z.number().int().positive(),
    userId: z.union([z.number().int().positive(), z.string().min(1)]),
    status: z.enum(['PRESENT', 'LATE', 'ABSENT']),
  }),
});

const sessionIdParamSchema = z.object({
  params: z.object({ sessionId: z.coerce.number().int().positive() }),
});

module.exports = { markDeviceAttendanceSchema, markManualAttendanceSchema, sessionIdParamSchema };
