import express from 'express';
import {
  updateUserStatus,
  getUserStatus,
  updatePrivacySettings,
  updateNotificationSettings
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// User status routes
router.put('/status', protect, updateUserStatus);
router.get('/:userId/status', protect, getUserStatus);

// Privacy settings routes
router.put('/privacy', protect, updatePrivacySettings);

// Notification settings routes
router.put('/notifications', protect, updateNotificationSettings);

export default router;
