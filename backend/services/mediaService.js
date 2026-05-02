import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload media file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} resourceType - Type of resource (image, video, raw, auto)
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
export const uploadToCloudinary = async (fileBuffer, resourceType = 'auto', options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: 'quickchat',
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete media file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Type of resource (image, video, raw)
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
  }
};

/**
 * Generate video thumbnail
 * @param {string} videoUrl - Video URL
 * @param {string} publicId - Video public ID
 * @returns {string} Thumbnail URL
 */
export const generateVideoThumbnail = (publicId) => {
  // Cloudinary automatically generates thumbnails for videos
  // We can get a thumbnail by transforming the video URL
  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    transformation: [
      { width: 400, height: 400, crop: 'fill' },
      { quality: 'auto' },
    ],
  });
};

/**
 * Compress and optimize image
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} Upload result with compressed image URL
 */
export const compressImage = async (imageBuffer) => {
  return uploadToCloudinary(imageBuffer, 'image', {
    transformation: [
      { width: 1920, crop: 'limit' }, // Max width 1920px, maintains aspect ratio
      { quality: 'auto' }, // Automatic quality optimization
      { fetch_format: 'auto' }, // Automatic format selection (WebP when supported)
    ],
  });
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
  generateVideoThumbnail,
  compressImage,
};
