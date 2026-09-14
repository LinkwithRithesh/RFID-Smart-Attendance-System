const timetableService = require('../services/timetable.service');
const { success } = require('../utils/apiResponse');

async function createSlot(req, res, next) {
  try {
    const slot = await timetableService.createSlot(req.body);
    return success(res, 201, 'Timetable slot created', slot);
  } catch (err) {
    next(err);
  }
}

async function listSlots(req, res, next) {
  try {
    const slots = await timetableService.listSlots(req.query);
    return success(res, 200, 'Timetable slots retrieved', slots);
  } catch (err) {
    next(err);
  }
}

async function getSlot(req, res, next) {
  try {
    const slot = await timetableService.getSlot(req.params.id);
    return success(res, 200, 'Timetable slot retrieved', slot);
  } catch (err) {
    next(err);
  }
}

async function updateSlot(req, res, next) {
  try {
    const slot = await timetableService.updateSlot(req.params.id, req.body);
    return success(res, 200, 'Timetable slot updated', slot);
  } catch (err) {
    next(err);
  }
}

async function deleteSlot(req, res, next) {
  try {
    await timetableService.deleteSlot(req.params.id);
    return success(res, 200, 'Timetable slot deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { createSlot, listSlots, getSlot, updateSlot, deleteSlot };
