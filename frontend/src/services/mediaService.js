import axios from 'axios';

const API_URL = 'http://localhost:5000/api/media/';

// File type validation
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
  audio: 10 * 1024 * 1024, // 10MB
};

// Voice recording duration limit (in seconds)
export const VOICE_DURATION_LIMIT = 5 * 60; // 5 minutes

/**
 * Validate a file before upload
 * @param {File} file - The file to validate
 * @returns {Object} - { valid: boolean, error: string, mediaType: string }
 */
export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Determine media type
  let mediaType = null;
  let allowedTypes = [];
  let sizeLimit = 0;

  if (ALLOWED_FILE_TYPES.image.includes(file.type)) {
    mediaType = 'image';
    allowedTypes = ALLOWED_FILE_TYPES.image;
    sizeLimit = FILE_SIZE_LIMITS.image;
  } else if (ALLOWED_FILE_TYPES.video.includes(file.type)) {
    mediaType = 'video';
    allowedTypes = ALLOWED_FILE_TYPES.video;
    sizeLimit = FILE_SIZE_LIMITS.video;
  } else if (ALLOWED_FILE_TYPES.document.includes(file.type)) {
    mediaType = 'file';
    allowedTypes = ALLOWED_FILE_TYPES.document;
    sizeLimit = FILE_SIZE_LIMITS.document;
  } else if (ALLOWED_FILE_TYPES.audio.includes(file.type)) {
    mediaType = 'voice';
    allowedTypes = ALLOWED_FILE_TYPES.audio;
    sizeLimit = FILE_SIZE_LIMITS.audio;
  } else {
    return {
      valid: false,
      error: `File type not supported. Allowed types: images (JPEG, PNG, GIF, WEBP), videos (MP4, MOV, WEBM), documents (PDF, DOC, DOCX, XLS, XLSX, TXT), audio (WEBM, MP3)`,
    };
  }

  // Check file size
  if (file.size > sizeLimit) {
    const limitMB = Math.round(sizeLimit / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds ${limitMB}MB limit for ${mediaType} files`,
    };
  }

  return { valid: true, mediaType };
};

/**
 * Validate voice recording duration
 * @param {number} duration - Duration in seconds
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateVoiceDuration = (duration) => {
  if (duration > VOICE_DURATION_LIMIT) {
    return {
      valid: false,
      error: `Voice recording exceeds 5 minute limit`,
    };
  }
  return { valid: true };
};

/**
 * Upload media file to server
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Progress callback (percentage)
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Upload result with media URLs
 */
export const uploadMedia = async (file, onProgress, token) => {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Create FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mediaType', validation.mediaType);

  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) {
          onProgress(progress);
        }
      },
    };

    const response = await axios.post(`${API_URL}upload`, formData, config);
    return response.data;
  } catch (error) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      'Upload failed. Please try again.';
    throw new Error(message);
  }
};

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} - File extension
 */
export const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format duration for display
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration (MM:SS)
 */
export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default {
  validateFile,
  validateVoiceDuration,
  uploadMedia,
  getFileExtension,
  formatFileSize,
  formatDuration,
  VOICE_DURATION_LIMIT,
};
