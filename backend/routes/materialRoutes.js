const express = require('express');
const router = express.Router();
const {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} = require('../controllers/materialController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(checkPermission('materials'), getMaterials)
  .post(checkPermission('materials'), createMaterial);

router
  .route('/:id')
  .put(checkPermission('materials'), updateMaterial)
  .delete(checkPermission('materials'), deleteMaterial);

module.exports = router;
