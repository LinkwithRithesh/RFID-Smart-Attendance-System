const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { success } = require('../utils/apiResponse');
const prisma = require('../config/database');

const router = express.Router();

// Get subjects (optionally filtered by courseId or facultyId)
router.get('/', async (req, res, next) => {
  try {
    const { courseId, facultyId } = req.query;
    const where = {};
    if (courseId) where.courseId = Number(courseId);
    if (facultyId) where.facultyId = Number(facultyId);

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        course: { select: { id: true, code: true, name: true } },
        faculty: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { code: 'asc' },
    });

    return success(res, 200, 'Subjects retrieved', subjects);
  } catch (err) {
    next(err);
  }
});

// Admin-only routes
router.use(authenticate, authorize('ADMINISTRATOR', 'ADMIN'));

// Create subject
router.post('/', async (req, res, next) => {
  try {
    const { code, name, courseId, semester, credits, facultyId } = req.body;
    const subject = await prisma.subject.create({
      data: {
        code,
        name,
        courseId: Number(courseId),
        semester: Number(semester) || 1,
        credits: Number(credits) || 3,
        facultyId: facultyId ? Number(facultyId) : null,
      },
      include: {
        course: { select: { id: true, code: true, name: true } },
        faculty: { select: { id: true, fullName: true, email: true } },
      },
    });
    return success(res, 201, 'Subject created', subject);
  } catch (err) {
    next(err);
  }
});

// Update subject (assign faculty, etc.)
router.patch('/:id', async (req, res, next) => {
  try {
    const { facultyId, name, code, semester, credits } = req.body;
    const data = {};
    if (facultyId !== undefined) data.facultyId = facultyId ? Number(facultyId) : null;
    if (name !== undefined) data.name = name;
    if (code !== undefined) data.code = code;
    if (semester !== undefined) data.semester = Number(semester);
    if (credits !== undefined) data.credits = Number(credits);

    const subject = await prisma.subject.update({
      where: { id: Number(req.params.id) },
      data,
      include: {
        course: { select: { id: true, code: true, name: true } },
        faculty: { select: { id: true, fullName: true, email: true } },
      },
    });
    return success(res, 200, 'Subject updated', subject);
  } catch (err) {
    next(err);
  }
});

// Delete subject
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.subject.delete({
      where: { id: Number(req.params.id) },
    });
    return success(res, 200, 'Subject deleted');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
