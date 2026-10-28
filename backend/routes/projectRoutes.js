const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(checkPermission('projects'), getProjects)
  .post(checkPermission('projects'), createProject);

router
  .route('/:id')
  .get(checkPermission('projects'), getProjectById)
  .put(checkPermission('projects'), updateProject)
  .delete(checkPermission('projects'), deleteProject);

module.exports = router;
