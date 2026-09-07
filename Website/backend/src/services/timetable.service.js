const ApiError = require('../utils/ApiError');
const timetableRepository = require('../repositories/timetable.repository');

function parseTimeString(value) {
  const [hours, minutes, seconds = '0'] = value.split(':');
  return new Date(Date.UTC(1970, 0, 1, Number(hours), Number(minutes), Number(seconds)));
}

function toPublicSlot(slot) {
  return {
    id: slot.id,
    subjectId: slot.subjectId,
    facultyId: slot.facultyId,
    departmentId: slot.departmentId,
    roomNumber: slot.roomNumber,
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
    semester: slot.semester,
    academicYear: slot.academicYear,
  };
}

async function createSlot(data) {
  if (parseTimeString(data.startTime) >= parseTimeString(data.endTime)) {
    throw new ApiError(400, 'startTime must be before endTime');
  }

  const slot = await timetableRepository.create({
    ...data,
    startTime: parseTimeString(data.startTime),
    endTime: parseTimeString(data.endTime),
  });
  return toPublicSlot(slot);
}

async function listSlots(query) {
  const slots = await timetableRepository.list(query);
  return slots.map(toPublicSlot);
}

async function getSlot(id) {
  const slot = await timetableRepository.findById(id);
  if (!slot) {
    throw new ApiError(404, 'Timetable slot not found');
  }
  return toPublicSlot(slot);
}

async function updateSlot(id, data) {
  const existing = await timetableRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Timetable slot not found');
  }

  const updateData = { ...data };
  if (data.startTime) updateData.startTime = parseTimeString(data.startTime);
  if (data.endTime) updateData.endTime = parseTimeString(data.endTime);

  const updated = await timetableRepository.update(id, updateData);
  return toPublicSlot(updated);
}

async function deleteSlot(id) {
  const existing = await timetableRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Timetable slot not found');
  }
  await timetableRepository.remove(id);
}

module.exports = { createSlot, listSlots, getSlot, updateSlot, deleteSlot };
