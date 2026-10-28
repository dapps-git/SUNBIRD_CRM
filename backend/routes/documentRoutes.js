const express = require('express');
const router = express.Router();
const {
  getDocuments,
  uploadDocument,
  updateDocumentKyc,
  deleteDocument,
} = require('../controllers/documentController');
const { protect, checkPermission } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router
  .route('/')
  .get(checkPermission('documents'), getDocuments)
  .post(checkPermission('documents'), upload.single('file'), uploadDocument);

router.post(
  '/upload',
  checkPermission('documents'),
  upload.single('file'),
  uploadDocument
);

router.patch('/:id/kyc', checkPermission('documents'), updateDocumentKyc);
router.delete('/:id', checkPermission('documents'), deleteDocument);

module.exports = router;
