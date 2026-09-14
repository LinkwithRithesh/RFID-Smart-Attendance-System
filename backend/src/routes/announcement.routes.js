const express = require('express');
const announcementController = require('../controllers/announcement.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  createAnnouncementSchema,
  listAnnouncementsQuerySchema,
  announcementIdParamSchema,
} = require('../validations/announcement.validation');

const router = express.Router();

router.get('/public', announcementController.listPublicAnnouncements);

router.use(authenticate);

// Any authenticated user reads announcements (a campus notice board).
router.get('/', validate(listAnnouncementsQuerySchema), announcementController.listAnnouncements);

// Only staff issue/manage announcements.
const staffRoles = authorize('FACULTY', 'HOD', 'DEAN', 'ADMINISTRATOR');
router.post('/', staffRoles, validate(createAnnouncementSchema), announcementController.createAnnouncement);
router.patch('/:id/pin', staffRoles, validate(announcementIdParamSchema), announcementController.pin);
router.patch('/:id/unpin', staffRoles, validate(announcementIdParamSchema), announcementController.unpin);
router.delete('/:id', staffRoles, validate(announcementIdParamSchema), announcementController.deleteAnnouncement);

module.exports = router;
