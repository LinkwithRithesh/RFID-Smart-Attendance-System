const express = require('express');
const { success } = require('../utils/apiResponse');

const router = express.Router();

router.get('/', (req, res) => {
  return success(res, 200, 'Server is healthy', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
