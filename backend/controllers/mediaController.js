import {
  uploadToCloudinary,
  compressImage,
  generateVideoThumbnail,
  deleteFromCloudinary,
} from '../services/mediaService.js';

// File type validation mappings
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
  audio: ['audio/webm', 'audio/mpeg', 'audio/mp3'],
};

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  document: 50 * 1024 * 1024, // 50MB
  audio: 10 * 1024 * 1024, // 10MB (5 minutes at reasonable bitrate)
};

// Voice recording duration limit (in seconds)
const MAX_VOICE_DURATION = 5 * 60; // 5 minutes

/**
 * Determine media type from MIME type
 * @param {string} mimeType - File MIME type
 * @returns {string|null} Media type (image, video, document, audio) or null
 */
const getMediaType = (mimeType) => {
  for (const [type, mimeTypes] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (mimeTypes.includes(mimeType)) {
      return type;
    }
  }
  return null;
};

/**
 * Validate file type and size
 * @param {Object} file - Multer file object
 * @returns {Object} Validation result { valid: boolean, error: string, mediaType: string }
 */
const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  const mediaType = getMediaType(file.mimetype);

  if (!mediaType) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.mimetype}. Allowed types: images (JPEG, PNG, GIF, WEBP), videos (MP4, MOV, WEBM), documents (PDF, DOC, DOCX, XLS, XLSX, TXT), audio (WEBM, MP3)`,
    };
  }

  const sizeLimit = FILE_SIZE_LIMITS[mediaType];
  if (file.size > sizeLimit) {
    const limitMB = Math.round(sizeLimit / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds limit. Maximum size for ${mediaType} files is ${limitMB}MB`,
    };
  }

  return { valid: true, mediaType };
};

/**
 * Upload media file
 * POST /api/media/upload
 */
export const uploadMedia = async (req, res) => {
  try {
    const file = req.file;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        retryable: false,
      });
    }

    const { mediaType } = validation;
    let uploadResult;
    let thumbnailUrl = null;

    // Handle different media types
    switch (mediaType) {
      case 'image':
        // Compress and upload image
        uploadResult = await compressImage(file.buffer);
        break;

      case 'video':
        // Upload video
        uploadResult = await uploadToCloudinary(file.buffer, 'video');
        // Generate thumbnail
        thumbnailUrl = generateVideoThumbnail(uploadResult.public_id);
        break;

      case 'audio':
        // Upload audio (voice message)
        uploadResult = await uploadToCloudinary(file.buffer, 'video'); // Cloudinary uses 'video' for audio
        
        // Check duration if available
        if (uploadResult.duration && uploadResult.duration > MAX_VOICE_DURATION) {
          // Delete the uploaded file
          await deleteFromCloudinary(uploadResult.public_id, 'video');
          return res.status(400).json({
            success: false,
            error: `Voice recording exceeds maximum duration of 5 minutes`,
            retryable: false,
          });
        }
        break;

      case 'document':
        // Upload document as raw file
        uploadResult = await uploadToCloudinary(file.buffer, 'raw');
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid media type',
          retryable: false,
        });
    }

    // Return upload result
    res.status(200).json({
      success: true,
      data: {
        mediaUrl: uploadResult.secure_url,
        thumbnailUrl: thumbnailUrl,
        mediaType: mediaType,
        fileName: file.originalname,
        fileSize: file.size,
        duration: uploadResult.duration || null,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
      },
    });
  } catch (error) {
    console.error('Media upload error:', error);
    
    // Determine if error is retryable
    const retryable = !error.message.includes('Invalid') && 
                      !error.message.includes('Unsupported');

    res.status(500).json({
      success: false,
      error: 'Failed to upload media. Please try again.',
      retryable: retryable,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get upload progress (placeholder for future implementation)
 * This would typically be handled by the client-side upload library
 * or through WebSocket events for real-time progress tracking
 */
export const getUploadProgress = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Upload progress tracking is handled client-side',
  });
};

export default {
  uploadMedia,
  getUploadProgress,
};
