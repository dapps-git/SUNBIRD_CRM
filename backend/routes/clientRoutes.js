const express = require('express');
const router = express.Router();
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  updateKycStatus,
  deleteClient,
} = require('../controllers/clientController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(checkPermission('clients'), getClients)
  .post(checkPermission('clients'), createClient);

router
  .route('/:id')
  .get(checkPermission('clients'), getClientById)
  .put(checkPermission('clients'), updateClient)
  .delete(checkPermission('clients'), deleteClient);

router.patch('/:id/kyc', checkPermission('clients'), updateKycStatus);

module.exports = router;
