const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/database');

const router = express.Router();
router.use(authenticate, authorize('ADMINISTRATOR', 'ADMIN'));

// List sections
router.get('/', async (req, res, next) => {
  try {
    const sections = await prisma.section.findMany({
      include: {
        course: { select: { name: true, department: { select: { name: true } } } },
      },
    });

    const formatted = sections.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      department: s.course?.department?.name || 'Engineering',
      semester: s.semester,
      capacity: s.maxCapacity,
      enrolledCount: 0,
    }));

    return success(res, 200, 'Sections retrieved', formatted);
  } catch (err) {
    next(err);
  }
});

// Create section
router.post('/', async (req, res, next) => {
  try {
    const { name, code, courseId, semester, capacity } = req.body;
    let targetCourseId = Number(courseId);
    if (!targetCourseId) {
      const defaultCourse = await prisma.course.findFirst();
      if (!defaultCourse) throw new ApiError(400, 'No course exists to attach section to');
      targetCourseId = defaultCourse.id;
    }

    const section = await prisma.section.create({
      data: {
        name: name || 'Section A',
        code: code || `SEC-${Date.now()}`,
        courseId: targetCourseId,
        semester: Number(semester) || 3,
        maxCapacity: Number(capacity) || 60,
      },
      include: {
        course: { select: { department: { select: { name: true } } } },
      },
    });

    return success(res, 201, 'Section created', {
      id: section.id,
      name: section.name,
      code: section.code,
      department: section.course?.department?.name || 'Engineering',
      semester: section.semester,
      capacity: section.maxCapacity,
      enrolledCount: 0,
    });
  } catch (err) {
    next(err);
  }
});

// Update section
router.patch('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, code, semester, capacity } = req.body;

    const existing = await prisma.section.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Section not found');

    const updated = await prisma.section.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(semester && { semester: Number(semester) }),
        ...(capacity && { maxCapacity: Number(capacity) }),
      },
    });

    return success(res, 200, 'Section updated', updated);
  } catch (err) {
    next(err);
  }
});

// Delete section
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.section.delete({ where: { id } });
    return success(res, 200, 'Section deleted');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

