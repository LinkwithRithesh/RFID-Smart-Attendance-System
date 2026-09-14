const express = require('express');
const prisma = require('../config/database');
const { success } = require('../utils/apiResponse');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log('Departments:', departments);

    return success(
      res,
      200,
      'Departments retrieved successfully',
      departments
    );
  } catch (err) {
    console.error('DEPARTMENTS API ERROR:', err);
    next(err);
  }
});

module.exports = router;