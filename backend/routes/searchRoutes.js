import express from 'express';
import { searchMessages } from '../controllers/searchController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/messages').get(protect, searchMessages);

export default router;
