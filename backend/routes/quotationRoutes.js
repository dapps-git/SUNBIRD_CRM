const express = require('express');
const router = express.Router();
const {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
} = require('../controllers/quotationController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(checkPermission('quotations'), getQuotations)
  .post(checkPermission('quotations'), createQuotation);

router
  .route('/:id')
  .get(checkPermission('quotations'), getQuotationById)
  .put(checkPermission('quotations'), updateQuotation)
  .delete(checkPermission('quotations'), deleteQuotation);

module.exports = router;
