const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceByClientId,
  saveServiceWarranty,
  addClaim,
  updateClaim,
} = require('../controllers/serviceController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(checkPermission('warranty'), getServices)
  .post(checkPermission('warranty'), saveServiceWarranty);

router.get('/client/:clientId', checkPermission('warranty'), getServiceByClientId);
router.post('/:id/claims', checkPermission('warranty'), addClaim);
router.patch('/:id/claims/:claimId', checkPermission('warranty'), updateClaim);

module.exports = router;
