import express from 'express';
import multer from 'multer';
import { uploadMedia, getUploadProgress } from '../controllers/mediaController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for memory storage
// Files will be stored in memory as Buffer objects
const storage = multer.memoryStorage();

// Configure multer with file size limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max (will be validated per type in controller)
  },
  fileFilter: (req, file, cb) => {
    // Basic validation - detailed validation happens in controller
    if (!file.mimetype) {
      cb(new Error('Invalid file type'), false);
    } else {
      cb(null, true);
    }
  },
});

// Routes
// POST /api/media/upload - Upload media file
router.post('/upload', protect, upload.single('file'), uploadMedia);

// GET /api/media/upload/progress - Get upload progress (placeholder)
router.get('/upload/progress', protect, getUploadProgress);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 100MB.',
        retryable: false,
      });
    }
    return res.status(400).json({
      success: false,
      error: error.message,
      retryable: false,
    });
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message || 'File upload failed',
      retryable: true,
    });
  }
  
  next();
});

export default router;
