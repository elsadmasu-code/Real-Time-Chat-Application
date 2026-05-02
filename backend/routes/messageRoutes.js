import express from 'express';
import { 
  allMessages, 
  sendMessage, 
  editMessage, 
  deleteMessage, 
  copyMessage,
  reactToMessage,
  updateMessageStatus,
  forwardMessage
} from '../controllers/messageController.js';
import { getMediaGallery } from '../controllers/searchController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:chatId').get(protect, allMessages);
router.route('/:chatId/media').get(protect, getMediaGallery);
router.route('/').post(protect, sendMessage);
router.route('/:messageId').put(protect, editMessage);
router.route('/:messageId').delete(protect, deleteMessage);
router.route('/:messageId/copy').get(protect, copyMessage);
router.route('/:messageId/react').post(protect, reactToMessage);
router.route('/:messageId/status').put(protect, updateMessageStatus);
router.route('/:messageId/forward').post(protect, forwardMessage);

export default router;
