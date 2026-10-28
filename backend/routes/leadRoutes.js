const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  updateLeadStatus,
  convertLeadToClient,
  deleteLead,
} = require('../controllers/leadController');
const { protect, optionalAuth, checkPermission } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, createLead);

router.use(protect);

router.route('/').get(checkPermission('leads'), getLeads);

router
  .route('/:id')
  .get(checkPermission('leads'), getLeadById)
  .put(checkPermission('leads'), updateLead)
  .delete(checkPermission('leads'), deleteLead);

router.patch('/:id/status', checkPermission('leads'), updateLeadStatus);
router.post('/:id/convert', checkPermission('leads'), convertLeadToClient);

module.exports = router;
