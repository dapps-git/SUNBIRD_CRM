const express = require('express');
const router = express.Router();
const {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
} = require('../controllers/paymentController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(checkPermission('payments'), getPayments)
  .post(checkPermission('payments'), createPayment);

router
  .route('/:id')
  .put(checkPermission('payments'), updatePayment)
  .delete(checkPermission('payments'), deletePayment);

module.exports = router;
