const express = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
  userIdParamSchema,
} = require('../validations/user.validation');

const router = express.Router();

router.use(authenticate);

// GET /:id and PATCH /:id allow self-access (checked in the service) in addition to
// ADMINISTRATOR — users need to view and update their own contact details.
router.get('/:id', validate(userIdParamSchema), userController.getUser);
router.patch('/:id', validate(userIdParamSchema), validate(updateUserSchema), userController.updateUser);

// Everything else remains admin-only: accounts are provisioned by
// administrators, not self-registered, matching the spec's enterprise model.
router.use(authorize('ADMIN'));
router.post('/', validate(createUserSchema), userController.createUser);
router.get('/', validate(listUsersQuerySchema), userController.listUsers);
router.delete('/:id', validate(userIdParamSchema), userController.deactivateUser);

module.exports = router;
