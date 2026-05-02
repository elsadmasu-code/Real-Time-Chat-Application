import Story from '../models/Story.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { deleteFromCloudinary } from '../services/mediaService.js';

// Create story
export const createStory = async (req, res) => {
  try {
    const { mediaType, mediaUrl, thumbnailUrl, cloudinaryPublicId } = req.body;

    // Validate required fields
    if (!mediaType || !mediaUrl || !cloudinaryPublicId) {
      return res.status(400).json({ 
        message: 'mediaType, mediaUrl, and cloudinaryPublicId are required' 
      });
    }

    // Validate mediaType
    if (!['image', 'video'].includes(mediaType)) {
      return res.status(400).json({ 
        message: 'mediaType must be "image" or "video"' 
      });
    }

    // Set expiresAt to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create story
    const newStory = {
      user: req.user._id,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      cloudinaryPublicId,
      expiresAt,
      viewedBy: [] // Initialize empty viewedBy array
    };

    let story = await Story.create(newStory);

    // Populate user details
    story = await story.populate('user', 'name pic');

    res.status(201).json(story);
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get active stories
export const getActiveStories = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    // Get all active stories (expiresAt > now)
    let query = {
      expiresAt: { $gt: new Date() }
    };

    // Filter by privacy settings
    if (currentUser.privacySettings && currentUser.privacySettings.storyVisibility === 'contacts') {
      // TODO: Implement contacts filtering when contacts feature is available
      // For now, show all stories
    }

    const stories = await Story.find(query)
      .populate('user', 'name pic')
      .populate('viewedBy.user', 'name pic')
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error('Error getting active stories:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mark story as viewed
export const viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;

    // Find the story
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if story has expired
    if (new Date() > story.expiresAt) {
      return res.status(410).json({ message: 'Story has expired' });
    }

    // Check if user has already viewed this story
    const alreadyViewed = story.viewedBy.some(
      view => view.user.toString() === req.user._id.toString()
    );

    if (!alreadyViewed) {
      // Add viewer's user ID and timestamp to viewedBy array
      story.viewedBy.push({
        user: req.user._id,
        viewedAt: new Date()
      });

      await story.save();
    }

    // Populate and return updated story
    const updatedStory = await Story.findById(storyId)
      .populate('user', 'name pic')
      .populate('viewedBy.user', 'name pic');

    res.json(updatedStory);
  } catch (error) {
    console.error('Error viewing story:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get story viewers
export const getStoryViewers = async (req, res) => {
  try {
    const { storyId } = req.params;

    // Find the story
    const story = await Story.findById(storyId)
      .populate('viewedBy.user', 'name pic email');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Verify requesting user is the story creator
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to view story viewers' 
      });
    }

    // Return viewedBy array with user details and timestamps
    res.json({
      storyId: story._id,
      viewCount: story.viewedBy.length,
      viewers: story.viewedBy
    });
  } catch (error) {
    console.error('Error getting story viewers:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reply to story
export const replyToStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { content } = req.body;

    // Validate content
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Find the story
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if story has expired
    if (new Date() > story.expiresAt) {
      return res.status(410).json({ message: 'Story has expired' });
    }

    // Find or create direct chat between replier and story creator
    let chat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [req.user._id, story.user] }
    });

    if (!chat) {
      // Create new direct chat
      chat = await Chat.create({
        chatName: 'Direct Chat',
        isGroupChat: false,
        users: [req.user._id, story.user]
      });
    }

    // Create message with story reference
    const newMessage = {
      sender: req.user._id,
      content,
      chat: chat._id,
      status: 'sent',
      // Store story reference in a metadata field (we'll add this to Message model if needed)
      // For now, we can add it as a custom field or in content
      storyReference: storyId
    };

    let message = await Message.create(newMessage);

    // Populate the message
    message = await message.populate('sender', 'name pic');
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name pic email',
    });

    // Update chat's latest message
    await Chat.findByIdAndUpdate(chat._id, { latestMessage: message });

    res.status(201).json({
      success: true,
      message: 'Story reply sent successfully',
      messageData: message
    });
  } catch (error) {
    console.error('Error replying to story:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete story
export const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;

    // Find the story
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Verify requesting user is the story creator
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to delete this story' 
      });
    }

    // Delete from Cloudinary
    try {
      // Determine resource type based on mediaType
      const resourceType = story.mediaType === 'video' ? 'video' : 'image';
      await deleteFromCloudinary(story.cloudinaryPublicId, resourceType);
    } catch (cloudinaryError) {
      console.error('Cloudinary deletion failed:', cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }

    // Delete from database
    await Story.deleteOne({ _id: storyId });

    res.json({
      success: true,
      message: 'Story deleted successfully',
      storyId
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ message: error.message });
  }
};
