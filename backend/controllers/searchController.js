import asyncHandler from 'express-async-handler';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

// @desc    Search messages with filters
// @route   GET /api/search/messages
// @access  Protected
export const searchMessages = asyncHandler(async (req, res) => {
  const { q, chatId, userId, dateFrom, dateTo, mediaType } = req.query;
  const currentUserId = req.user._id;

  // Build search query
  const searchQuery = {};

  // Full-text search on content
  if (q && q.trim()) {
    searchQuery.$text = { $search: q.trim() };
  }

  // Apply filters
  if (chatId) {
    // Verify user has access to the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }
    
    const hasAccess = chat.users.some(
      (user) => user.toString() === currentUserId.toString()
    );
    
    if (!hasAccess) {
      res.status(403);
      throw new Error('You do not have access to this chat');
    }
    
    searchQuery.chat = chatId;
  } else {
    // If no specific chat, only search in chats the user is part of
    const userChats = await Chat.find({ users: currentUserId }).select('_id');
    const chatIds = userChats.map(chat => chat._id);
    searchQuery.chat = { $in: chatIds };
  }

  // Filter by sender
  if (userId) {
    searchQuery.sender = userId;
  }

  // Filter by date range
  if (dateFrom || dateTo) {
    searchQuery.createdAt = {};
    if (dateFrom) {
      searchQuery.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      searchQuery.createdAt.$lte = new Date(dateTo);
    }
  }

  // Filter by media type
  if (mediaType) {
    searchQuery.mediaType = mediaType;
  }

  // Exclude deleted messages
  searchQuery.deletedForEveryone = false;

  // Execute search
  let query = Message.find(searchQuery)
    .populate('sender', 'name pic')
    .populate('chat', 'chatName isGroupChat')
    .limit(50);

  // Sort by text score if text search is used, otherwise by date
  if (q && q.trim()) {
    query = query.sort({ score: { $meta: 'textScore' } });
  } else {
    query = query.sort({ createdAt: -1 });
  }

  const results = await query;

  // Format results with preview
  const formattedResults = results.map((message) => ({
    _id: message._id,
    content: message.content,
    sender: {
      _id: message.sender._id,
      name: message.sender.name,
      pic: message.sender.pic,
    },
    chat: {
      _id: message.chat._id,
      chatName: message.chat.chatName,
      isGroupChat: message.chat.isGroupChat,
    },
    mediaType: message.mediaType,
    mediaUrl: message.mediaUrl,
    thumbnailUrl: message.thumbnailUrl,
    createdAt: message.createdAt,
    // Preview: first 100 characters of content
    preview: message.content ? message.content.substring(0, 100) : null,
  }));

  res.json(formattedResults);
});

// @desc    Get media gallery for a chat
// @route   GET /api/messages/:chatId/media
// @access  Protected
export const getMediaGallery = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { mediaType, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
  const currentUserId = req.user._id;

  // Verify user has access to the chat
  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  const hasAccess = chat.users.some(
    (user) => user.toString() === currentUserId.toString()
  );

  if (!hasAccess) {
    res.status(403);
    throw new Error('You do not have access to this chat');
  }

  // Build query
  const query = {
    chat: chatId,
    mediaType: { $ne: null }, // Only messages with media
    deletedForEveryone: false,
  };

  // Filter by specific media type
  if (mediaType) {
    query.mediaType = mediaType;
  }

  // Filter by date range
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) {
      query.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      query.createdAt.$lte = new Date(dateTo);
    }
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Get total count for hasMore flag
  const totalCount = await Message.countDocuments(query);
  const hasMore = totalCount > pageNum * limitNum;

  // Execute query with pagination
  const mediaMessages = await Message.find(query)
    .populate('sender', 'name pic')
    .sort({ createdAt: -1 }) // Newest first
    .skip(skip)
    .limit(limitNum);

  res.json({
    messages: mediaMessages,
    hasMore,
    page: pageNum,
    totalCount,
  });
});
