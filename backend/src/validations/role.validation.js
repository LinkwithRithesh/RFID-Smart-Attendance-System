const { z } = require('zod');

const roleIdParamSchema = z.object({
  params: z.object({ roleId: z.coerce.number().int().positive() }),
});

const createPermissionSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  }),
});

const assignPermissionSchema = z.object({
  params: z.object({ roleId: z.coerce.number().int().positive() }),
  body: z.object({ permissionId: z.number().int().positive() }),
});

const revokePermissionSchema = z.object({
  params: z.object({
    roleId: z.coerce.number().int().positive(),
    permissionId: z.coerce.number().int().positive(),
  }),
});

module.exports = {
  roleIdParamSchema,
  createPermissionSchema,
  assignPermissionSchema,
  revokePermissionSchema,
};
