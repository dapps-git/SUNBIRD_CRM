const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin', 'manager'));

router.route('/').get(getUsers).post(authorize('admin'), createUser);
router.route('/:id').put(authorize('admin'), updateUser).delete(authorize('admin'), deleteUser);
router.patch('/:id/reset-password', authorize('admin'), resetUserPassword);

module.exports = router;
