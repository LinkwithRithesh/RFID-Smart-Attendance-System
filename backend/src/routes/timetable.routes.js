const express = require('express');
const timetableController = require('../controllers/timetable.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  createTimetableSchema,
  updateTimetableSchema,
  timetableIdParamSchema,
  listTimetableQuerySchema,
} = require('../validations/timetable.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', validate(listTimetableQuerySchema), timetableController.listSlots);
router.get('/:id', validate(timetableIdParamSchema), timetableController.getSlot);

const adminOnly = authorize('ADMINISTRATOR', 'ADMIN');
router.post('/', adminOnly, validate(createTimetableSchema), timetableController.createSlot);
router.patch('/:id', adminOnly, validate(updateTimetableSchema), timetableController.updateSlot);
router.delete('/:id', adminOnly, validate(timetableIdParamSchema), timetableController.deleteSlot);

module.exports = router;
