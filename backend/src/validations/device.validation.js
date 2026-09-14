const { z } = require('zod');

const createDeviceSchema = z.object({
  body: z.object({
    deviceCode: z.string().min(1),
    location: z.string().optional(),
    departmentId: z.number().int().positive(),
    firmwareVersion: z.string().optional(),
  }),
});

const updateDeviceSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z
    .object({
      location: z.string().optional(),
      departmentId: z.number().int().positive().optional(),
      firmwareVersion: z.string().optional(),
      status: z.enum(['ONLINE', 'OFFLINE', 'MAINTENANCE']).optional(), // DECOMMISSIONED only via the dedicated endpoint
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

const deviceIdParamSchema = z.object({
  params: z.object({
    id: z.union([z.coerce.number().int().positive(), z.string().min(1)]),
  }),
});

const listDevicesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    departmentId: z.coerce.number().int().positive().optional(),
    status: z.enum(['ONLINE', 'OFFLINE', 'MAINTENANCE', 'DECOMMISSIONED']).optional(),
  }),
});

module.exports = {
  createDeviceSchema,
  updateDeviceSchema,
  deviceIdParamSchema,
  listDevicesQuerySchema,
};
