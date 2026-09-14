const { z } = require('zod');

const VALID_TARGET_ROLES = [
  'ALL', 'STUDENT', 'FACULTY', 'HOD', 'DEAN', 'ADMINISTRATOR',
  'OFFICE_STAFF', 'LAB_ASSISTANT', 'SECURITY', 'HOUSEKEEPING', 'MAINTENANCE',
];

const createAnnouncementSchema = z.object({
  body: z.object({
    referenceNo: z.string().min(1),
    title: z.string().min(1).max(200),
    message: z.string().min(1),
    category: z.enum(['CIRCULAR', 'ALERT', 'DEVICE_STATUS', 'EXAM', 'GENERAL']),
    priority: z.enum(['URGENT', 'HIGH', 'NORMAL']).optional().default('NORMAL'),
    targetRole: z.enum(VALID_TARGET_ROLES).optional().default('ALL'),
  }),
});

const listAnnouncementsQuerySchema = z.object({
  query: z.object({
    category: z.enum(['CIRCULAR', 'ALERT', 'DEVICE_STATUS', 'EXAM', 'GENERAL']).optional(),
    targetRole: z.enum(VALID_TARGET_ROLES).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
  }),
});

const announcementIdParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

module.exports = {
  VALID_TARGET_ROLES,
  createAnnouncementSchema,
  listAnnouncementsQuerySchema,
  announcementIdParamSchema,
};
