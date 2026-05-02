import Story from '../models/Story.js';
import { deleteFromCloudinary } from '../services/mediaService.js';

/**
 * Background job to delete expired stories
 * Runs periodically to clean up stories where expiresAt < now
 */
export const cleanupExpiredStories = async () => {
  try {
    console.log('Running story cleanup job...');

    // Find all expired stories
    const expiredStories = await Story.find({
      expiresAt: { $lt: new Date() }
    });

    if (expiredStories.length === 0) {
      console.log('No expired stories to clean up');
      return { success: true, deletedCount: 0 };
    }

    console.log(`Found ${expiredStories.length} expired stories to delete`);

    let deletedCount = 0;
    let cloudinaryErrors = 0;

    // Delete each expired story
    for (const story of expiredStories) {
      try {
        // Delete from Cloudinary
        const resourceType = story.mediaType === 'video' ? 'video' : 'image';
        await deleteFromCloudinary(story.cloudinaryPublicId, resourceType);
        console.log(`Deleted story ${story._id} from Cloudinary`);
      } catch (cloudinaryError) {
        console.error(`Cloudinary deletion failed for story ${story._id}:`, cloudinaryError.message);
        cloudinaryErrors++;
        // Continue with database deletion even if Cloudinary fails
      }

      try {
        // Delete from database
        await Story.deleteOne({ _id: story._id });
        deletedCount++;
        console.log(`Deleted story ${story._id} from database`);
      } catch (dbError) {
        console.error(`Database deletion failed for story ${story._id}:`, dbError.message);
      }
    }

    console.log(`Story cleanup completed: ${deletedCount} stories deleted, ${cloudinaryErrors} Cloudinary errors`);

    return {
      success: true,
      deletedCount,
      cloudinaryErrors,
      totalExpired: expiredStories.length
    };
  } catch (error) {
    console.error('Story cleanup job failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Start the story cleanup job scheduler
 * Runs every hour
 */
export const startStoryCleanupScheduler = () => {
  // Run immediately on startup
  cleanupExpiredStories();

  // Schedule to run every hour (3600000 ms)
  const intervalId = setInterval(cleanupExpiredStories, 3600000);

  console.log('Story cleanup scheduler started (runs every hour)');

  return intervalId;
};

export default {
  cleanupExpiredStories,
  startStoryCleanupScheduler
};
