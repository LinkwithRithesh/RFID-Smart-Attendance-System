const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/database');

const router = express.Router();
router.use(authenticate, authorize('ADMINISTRATOR', 'ADMIN'));

// List all courses
router.get('/', async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
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
