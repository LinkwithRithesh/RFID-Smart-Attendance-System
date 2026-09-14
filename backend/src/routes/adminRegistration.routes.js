const express = require('express');
const adminRegistrationController = require('../controllers/adminRegistration.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

// Gate all routes behind authentication + ADMINISTRATOR role authorization
router.use(authenticate);
router.use(authorize('ADMINISTRATOR'));

router.get('/pending', adminRegistrationController.getPendingRegistrations);
router.get('/:id', adminRegistrationController.getPendingRegistrationById);
router.patch('/:id/approve', adminRegistrationController.approveRegistration);
router.patch('/:id/reject', adminRegistrationController.rejectRegistration);

module.exports = router;
