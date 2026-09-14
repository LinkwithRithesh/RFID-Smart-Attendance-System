const express = require('express');
const roleController = require('../controllers/role.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  roleIdParamSchema,
  createPermissionSchema,
  assignPermissionSchema,
  revokePermissionSchema,
} = require('../validations/role.validation');

const router = express.Router();

router.use(authenticate, authorize('ADMINISTRATOR'));

router.get('/', roleController.listRoles);
router.get('/permissions', roleController.listPermissions);
router.post('/permissions', validate(createPermissionSchema), roleController.createPermission);
router.get('/:roleId/permissions', validate(roleIdParamSchema), roleController.listPermissionsForRole);
router.post('/:roleId/permissions', validate(assignPermissionSchema), roleController.assignPermission);
router.delete(
  '/:roleId/permissions/:permissionId',
  validate(revokePermissionSchema),
  roleController.revokePermission
);

module.exports = router;
