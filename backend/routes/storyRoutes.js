import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createStory,
  getActiveStories,
  viewStory,
  getStoryViewers,
  replyToStory,
  deleteStory
} from '../controllers/storyController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// POST /api/stories - Create story
router.post('/', createStory);

// GET /api/stories - Get active stories
router.get('/', getActiveStories);

// POST /api/stories/:storyId/view - Mark story as viewed
router.post('/:storyId/view', viewStory);

// GET /api/stories/:storyId/viewers - Get story viewers
router.get('/:storyId/viewers', getStoryViewers);

// POST /api/stories/:storyId/reply - Reply to story
router.post('/:storyId/reply', replyToStory);

// DELETE /api/stories/:storyId - Delete story
router.delete('/:storyId', deleteStory);

export default router;
