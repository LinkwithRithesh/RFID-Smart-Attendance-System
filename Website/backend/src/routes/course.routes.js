const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/database');

const router = express.Router();

// Public route to list courses (used by registration form)
router.get('/', async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const where = departmentId ? { departmentId: Number(departmentId) } : {};

    const courses = await prisma.course.findMany({
      where,
      include: {
        department: true,
        subjects: true,
      },
      orderBy: { code: 'asc' },
    });

    const data = courses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      departmentId: c.departmentId,
      department: c.department?.name || 'Engineering',
      durationSemesters: c.durationSemesters,
      semester: 3,
      credits: 4,
      totalClasses: 45,
    }));

    return success(res, 200, 'Courses retrieved', data);
  } catch (err) {
    next(err);
  }
});

// Admin-only routes
router.use(authenticate, authorize('ADMINISTRATOR', 'ADMIN'));

// Create course
router.post('/', async (req, res, next) => {
  try {
    const { code, name, departmentId, durationSemesters } = req.body;
    const course = await prisma.course.create({
      data: {
        code,
        name,
        departmentId: Number(departmentId) || 1,
        durationSemesters: Number(durationSemesters) || 8,
      },
    });
    return success(res, 201, 'Course created', course);
  } catch (err) {
    next(err);
  }
});

// Update course
router.patch('/:id', async (req, res, next) => {
  try {
    const course = await prisma.course.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    return success(res, 200, 'Course updated', course);
  } catch (err) {
    next(err);
  }
});

// Delete course
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.course.delete({
      where: { id: Number(req.params.id) },
    });
    return success(res, 200, 'Course deleted');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
