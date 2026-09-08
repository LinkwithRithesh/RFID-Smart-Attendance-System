const express = require('express');
const prisma = require('../config/database');
const authenticate = require('../middleware/authenticate');
const { success } = require('../utils/apiResponse');

const router = express.Router();

// All authenticated users can list departments (needed for student enrollment, filters, etc.)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: 'asc' },
    });

    return success(res, 200, 'Departments retrieved successfully', departments);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
