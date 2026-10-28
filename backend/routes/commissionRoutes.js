const express = require('express');
const router = express.Router();
const {
  getCommissions,
  createCommission,
  updateCommissionStatus,
  deleteCommission,
} = require('../controllers/commissionController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(checkPermission('commissions'), getCommissions)
  .post(checkPermission('commissions'), createCommission);

router.patch('/:id/status', checkPermission('commissions'), updateCommissionStatus);
router.delete('/:id', checkPermission('commissions'), deleteCommission);

module.exports = router;
