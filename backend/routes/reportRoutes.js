const express = require('express');
const router = express.Router();
const {
  getDashboardMetrics,
  generateReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardMetrics);
router.get('/export', generateReport);

module.exports = router;
