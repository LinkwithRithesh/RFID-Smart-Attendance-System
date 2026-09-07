const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/database');

const router = express.Router();
router.use(authenticate, authorize('ADMINISTRATOR', 'ADMIN'));

// In-memory / initial sections backing (aligned with university departments and student profiles)
let sectionsStore = [
  { id: 1, name: 'Section A', code: 'SEC-A', department: 'Electronics & Communication Engg', semester: 3, capacity: 65, enrolledCount: 62 },
  { id: 2, name: 'Section B', code: 'SEC-B', department: 'Computer Science & Engineering', semester: 3, capacity: 65, enrolledCount: 64 },
  { id: 3, name: 'Section C', code: 'SEC-C', department: 'Information Technology', semester: 5, capacity: 60, enrolledCount: 58 },
];

// List sections
router.get('/', (req, res) => {
  return success(res, 200, 'Sections retrieved', sectionsStore);
});

// Create section
router.post('/', (req, res) => {
  const { name, code, department, semester, capacity } = req.body;
  const newSection = {
    id: sectionsStore.length + 1,
    name: name || 'Section New',
    code: code || `SEC-${Date.now()}`,
    department: department || 'Engineering',
    semester: Number(semester) || 3,
    capacity: Number(capacity) || 60,
    enrolledCount: 0,
  };
  sectionsStore.push(newSection);
  return success(res, 201, 'Section created', newSection);
});

// Update section
router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = sectionsStore.findIndex((s) => s.id === id);
  if (idx === -1) throw new ApiError(404, 'Section not found');

  sectionsStore[idx] = { ...sectionsStore[idx], ...req.body };
  return success(res, 200, 'Section updated', sectionsStore[idx]);
});

// Delete section
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  sectionsStore = sectionsStore.filter((s) => s.id !== id);
  return success(res, 200, 'Section deleted');
});

module.exports = router;
