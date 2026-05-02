import express from 'express';
import {
  initiateCall,
  acceptCall,
  declineCall,
  endCall,
  getCallHistory
} from '../controllers/callController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.post('/initiate', protect, initiateCall);
router.post('/:callId/accept', protect, acceptCall);
router.post('/:callId/decline', protect, declineCall);
router.post('/:callId/end', protect, endCall);
router.get('/:chatId/history', protect, getCallHistory);

export default router;
