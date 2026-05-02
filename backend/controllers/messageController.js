import Message from '../models/Message.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';

export const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name pic email')
      .populate('chat');
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

export const sendMessage = async (req, res) => {
  const { 
    content, 
    chatId, 
    mediaType, 
    mediaUrl, 
    thumbnailUrl, 
    fileName, 
    fileSize, 
    duration,
    replyTo 
  } = req.body;

  // Validate that either content or media is provided
  if ((!content || content.trim() === '') && !mediaUrl) {
    console.log('Invalid data passed into request: content or media required');
    return res.sendStatus(400);
  }

  if (!chatId) {
    console.log('Invalid data passed into request: chatId required');
    return res.sendStatus(400);
  }

  // If replyTo is provided, validate that the original message exists and is in the same chat
  if (replyTo) {
    try {
      const originalMessage = await Message.findById(replyTo);
      if (!originalMessage) {
        console.log('Original message not found');
        return res.status(404).json({ message: 'Original message not found' });
      }
      if (originalMessage.chat.toString() !== chatId) {
        console.log('Original message is not in the same chat');
        return res.status(400).json({ message: 'Original message is not in the same chat' });
      }
    } catch (error) {
      console.log('Error validating original message:', error);
      return res.status(400).json({ message: 'Invalid replyTo message ID' });
    }
  }

  var newMessage = {
    sender: req.user._id,
    content: content || '',
    chat: chatId,
    status: 'sent', // Set initial status to "sent" after database save
  };

  // Add media fields if provided
  if (mediaType) {
    newMessage.mediaType = mediaType;
  }
  if (mediaUrl) {
    newMessage.mediaUrl = mediaUrl;
  }
  if (thumbnailUrl) {
    newMessage.thumbnailUrl = thumbnailUrl;
  }
  if (fileName) {
    newMessage.fileName = fileName;
  }
  if (fileSize) {
    newMessage.fileSize = fileSize;
  }
  if (duration) {
    newMessage.duration = duration;
  }
  if (replyTo) {
    newMessage.replyTo = replyTo;
  }

  try {
    var message = await Message.create(newMessage);

    message = await message.populate('sender', 'name pic');
    message = await message.populate('chat');
    message = await message.populate('replyTo');
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name pic email',
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

// Edit message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    // Validate content is provided
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify requesting user is the message sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    // Reject edits for media-only messages (mediaType not null and content empty)
    if (message.mediaType && (!message.content || message.content.trim() === '')) {
      return res.status(400).json({ message: 'Cannot edit media-only messages' });
    }

    // Store previous content in editHistory
    message.editHistory.push({
      content: message.content,
      editedAt: new Date()
    });

    // Update content, set isEdited to true, set editedAt timestamp
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    // Populate and return updated message
    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'name pic')
      .populate('chat')
      .populate('replyTo');

    res.json(updatedMessage);
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteType } = req.body;

    // Validate deleteType
    if (!deleteType || !['for-me', 'for-everyone'].includes(deleteType)) {
      return res.status(400).json({ message: 'Invalid deleteType. Must be "for-me" or "for-everyone"' });
    }

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (deleteType === 'for-me') {
      // Add user ID to deletedFor array
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
        await message.save();
      }
    } else if (deleteType === 'for-everyone') {
      // Verify requesting user is the message sender
      if (message.sender.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this message for everyone' });
      }

      // Check 48-hour time window
      const messageAge = Date.now() - new Date(message.createdAt).getTime();
      const fortyEightHours = 48 * 60 * 60 * 1000;
      
      if (messageAge > fortyEightHours) {
        return res.status(400).json({ message: 'Cannot delete for everyone after 48 hours' });
      }

      // Set deletedForEveryone to true and deletedAt timestamp
      message.deletedForEveryone = true;
      message.deletedAt = new Date();
      await message.save();
    }

    res.json({ 
      success: true, 
      message: 'Message deleted successfully',
      deleteType,
      messageId 
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: error.message });
  }
};

// Copy message
export const copyMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Reject for media-only messages (content empty and mediaType not null)
    if ((!message.content || message.content.trim() === '') && message.mediaType) {
      return res.status(400).json({ message: 'Cannot copy media-only messages' });
    }

    // Return message content
    res.json({ content: message.content });
  } catch (error) {
    console.error('Error copying message:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add or remove reaction
export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji, action } = req.body;

    // Validate inputs
    if (!emoji || !action) {
      return res.status(400).json({ message: 'Emoji and action are required' });
    }

    if (!['add', 'remove'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "add" or "remove"' });
    }

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (action === 'add') {
      // Add reaction: add reaction object with emoji, user ID, and timestamp
      message.reactions.push({
        emoji,
        user: req.user._id,
        createdAt: new Date()
      });
    } else if (action === 'remove') {
      // Remove reaction: remove reaction matching emoji and user ID
      message.reactions = message.reactions.filter(
        reaction => !(reaction.emoji === emoji && reaction.user.toString() === req.user._id.toString())
      );
    }

    await message.save();

    // Populate and return updated message
    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'name pic')
      .populate('chat')
      .populate('reactions.user', 'name pic');

    res.json(updatedMessage);
  } catch (error) {
    console.error('Error reacting to message:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update message status (delivered or read)
export const updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !['delivered', 'read'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "delivered" or "read"' });
    }

    // Find the message
    const message = await Message.findById(messageId)
      .populate('chat');
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify user is part of the chat
    const chat = await Chat.findById(message.chat._id);
    if (!chat.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this message status' });
    }

    if (status === 'delivered') {
      // Update status to "delivered"
      message.status = 'delivered';
    } else if (status === 'read') {
      // Check user's privacy settings for read receipts
      const user = await User.findById(req.user._id);
      
      if (user.privacySettings && user.privacySettings.showReadReceipts === false) {
        // User has disabled read receipts, don't update status
        return res.json({ 
          success: true, 
          message: 'Read receipt disabled by privacy settings',
          messageId 
        });
      }

      // Add user ID to readBy array if not already present
      if (!message.readBy.includes(req.user._id)) {
        message.readBy.push(req.user._id);
      }

      // Update status based on chat type
      if (chat.isGroupChat) {
        // For group chats: set status to "read" only when all participants (except sender) are in readBy
        const participantsExceptSender = chat.users.filter(
          userId => userId.toString() !== message.sender.toString()
        );
        
        const allRead = participantsExceptSender.every(userId =>
          message.readBy.some(readUserId => readUserId.toString() === userId.toString())
        );

        if (allRead) {
          message.status = 'read';
        }
      } else {
        // For one-on-one chats: set status to "read" immediately
        message.status = 'read';
      }
    }

    await message.save();

    // Populate and return updated message
    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'name pic')
      .populate('chat')
      .populate('readBy', 'name pic');

    res.json(updatedMessage);
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ message: error.message });
  }
};

// Forward message to other chats
export const forwardMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { chatIds } = req.body;

    // Validate chatIds
    if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
      return res.status(400).json({ message: 'chatIds array is required' });
    }

    // Find the original message
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ message: 'Original message not found' });
    }

    // Verify user has access to the original message's chat
    const originalChat = await Chat.findById(originalMessage.chat);
    if (!originalChat.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this message' });
    }

    const forwardedMessages = [];

    // For each destination chat, create new message with same content/media
    for (const chatId of chatIds) {
      // Verify user is part of destination chat
      const destinationChat = await Chat.findById(chatId);
      if (!destinationChat) {
        console.log(`Chat ${chatId} not found, skipping`);
        continue;
      }

      if (!destinationChat.users.includes(req.user._id)) {
        console.log(`User not authorized for chat ${chatId}, skipping`);
        continue;
      }

      // Create new message with same content/media
      const newMessage = {
        sender: req.user._id,
        content: originalMessage.content || '',
        chat: chatId,
        status: 'sent',
        isForwarded: true,
        forwardedBy: req.user._id,
        originalMessage: originalMessage._id
      };

      // Copy media fields if present (reuse existing Cloudinary URLs)
      if (originalMessage.mediaType) {
        newMessage.mediaType = originalMessage.mediaType;
      }
      if (originalMessage.mediaUrl) {
        newMessage.mediaUrl = originalMessage.mediaUrl;
      }
      if (originalMessage.thumbnailUrl) {
        newMessage.thumbnailUrl = originalMessage.thumbnailUrl;
      }
      if (originalMessage.fileName) {
        newMessage.fileName = originalMessage.fileName;
      }
      if (originalMessage.fileSize) {
        newMessage.fileSize = originalMessage.fileSize;
      }
      if (originalMessage.duration) {
        newMessage.duration = originalMessage.duration;
      }

      // Create the forwarded message
      let message = await Message.create(newMessage);

      // Populate the message
      message = await message.populate('sender', 'name pic');
      message = await message.populate('chat');
      message = await message.populate('originalMessage');
      message = await User.populate(message, {
        path: 'chat.users',
        select: 'name pic email',
      });

      // Update chat's latest message
      await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

      forwardedMessages.push(message);
    }

    res.json({
      success: true,
      message: 'Message forwarded successfully',
      forwardedMessages
    });
  } catch (error) {
    console.error('Error forwarding message:', error);
    res.status(500).json({ message: error.message });
  }
};
