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

// GET /:id allows self-access (checked in the service) in addition to
// ADMINISTRATOR — a logged-in user needs to see their own full profile.
router.get('/:id', validate(userIdParamSchema), userController.getUser);

// Everything else remains admin-only: accounts are provisioned by
// administrators, not self-registered, matching the spec's enterprise model.
router.use(authorize('ADMINISTRATOR'));
router.post('/', validate(createUserSchema), userController.createUser);
router.get('/', validate(listUsersQuerySchema), userController.listUsers);
router.patch('/:id', validate(updateUserSchema), userController.updateUser);
router.delete('/:id', validate(userIdParamSchema), userController.deactivateUser);

module.exports = router;
