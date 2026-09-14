const { z } = require('zod');

const listNotificationsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    unreadOnly: z.coerce.boolean().optional().default(false),
  }),
});

const notificationIdParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

const lowAttendanceAlertSchema = z.object({
  body: z.object({
    departmentId: z.number().int().positive(),
    from: z.string().datetime(),
    to: z.string().datetime(),
    role: z.string().optional(),
    threshold: z.number().min(0).max(100).optional(),
  }),
});

module.exports = { listNotificationsQuerySchema, notificationIdParamSchema, lowAttendanceAlertSchema };
