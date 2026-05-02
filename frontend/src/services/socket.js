import { io } from 'socket.io-client';
import store from '../store';
import {
  addMessage,
  updateMessage,
  deleteMessage,
} from '../store/slices/messageSlice';
import {
  addReaction,
  removeReaction,
} from '../store/slices/reactionsSlice';

// Socket instance
let socket = null;

// Connection state
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000; // 1 second

/**
 * Calculate exponential backoff delay for reconnection
 * @param {number} attempt - Current reconnection attempt number
 * @returns {number} Delay in milliseconds
 */
const getReconnectDelay = (attempt) => {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, max 60s
  const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, attempt), 60000);
  return delay;
};

/**
 * Initialize and configure Socket.IO client connection
 * @param {string} token - JWT authentication token
 * @returns {object} Socket instance
 */
export const setupSocket = (token) => {
  // If socket already exists and is connected, return it
  if (socket && isConnected) {
    return socket;
  }

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
  }

  // Get backend URL from environment or default to localhost
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  // Create new socket connection with authentication
  socket = io(SOCKET_URL, {
    auth: {
      token: token,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: BASE_RECONNECT_DELAY,
    reconnectionDelayMax: 60000,
    timeout: 20000,
    transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('Socket.IO connected:', socket.id);
    isConnected = true;
    reconnectAttempts = 0;
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket.IO disconnected:', reason);
    isConnected = false;

    // Handle manual disconnection vs unexpected disconnection
    if (reason === 'io server disconnect') {
      // Server disconnected the socket, need to manually reconnect
      socket.connect();
    }
    // For other reasons, socket.io will automatically try to reconnect
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error.message);
    isConnected = false;
    reconnectAttempts++;

    // Implement custom exponential backoff if needed
    if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
      const delay = getReconnectDelay(reconnectAttempts - 1);
      console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    } else {
      console.error('Max reconnection attempts reached. Please refresh the page.');
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
    isConnected = true;
    reconnectAttempts = 0;
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('Socket.IO reconnection attempt:', attemptNumber);
  });

  socket.on('reconnect_error', (error) => {
    console.error('Socket.IO reconnection error:', error.message);
  });

  socket.on('reconnect_failed', () => {
    console.error('Socket.IO reconnection failed after max attempts');
    isConnected = false;
  });

  // Message events
  socket.on('message-received', (message) => {
    console.log('Message received:', message);
    const chatId = message.chat._id || message.chat;
    store.dispatch(addMessage({ chatId, message }));
  });

  socket.on('message-updated', (message) => {
    console.log('Message updated:', message);
    const chatId = message.chat._id || message.chat;
    const messageId = message._id;
    store.dispatch(updateMessage({ chatId, messageId, updates: message }));
  });

  socket.on('message-deleted', ({ messageId, chatId, deletedForEveryone }) => {
    console.log('Message deleted:', { messageId, chatId, deletedForEveryone });
    store.dispatch(deleteMessage({ chatId, messageId, deletedForEveryone }));
  });

  socket.on('message-status-updated', ({ messageId, chatId, status, readBy }) => {
    console.log('Message status updated:', { messageId, status });
    store.dispatch(updateMessage({
      chatId,
      messageId,
      updates: { status, readBy },
    }));
  });

  // Reaction events
  socket.on('reaction-added', ({ messageId, reaction }) => {
    console.log('Reaction added:', { messageId, reaction });
    const userId = reaction.user._id || reaction.user;
    store.dispatch(addReaction({
      messageId,
      emoji: reaction.emoji,
      userId,
    }));
  });

  socket.on('reaction-removed', ({ messageId, emoji, userId }) => {
    console.log('Reaction removed:', { messageId, emoji, userId });
    store.dispatch(removeReaction({ messageId, emoji, userId }));
  });

  // Typing indicator events
  socket.on('user-typing', ({ chatId, user }) => {
    console.log('User typing:', { chatId, user });
    // Dispatch to status slice when it's implemented
    // For now, just log
    // store.dispatch(addTypingUser({ chatId, userId: user._id || user }));
  });

  socket.on('user-stopped-typing', ({ chatId, userId }) => {
    console.log('User stopped typing:', { chatId, userId });
    // Dispatch to status slice when it's implemented
    // For now, just log
    // store.dispatch(removeTypingUser({ chatId, userId }));
  });

  // User status events
  socket.on('user-status-changed', ({ userId, status, lastSeen }) => {
    console.log('User status changed:', { userId, status, lastSeen });
    // Dispatch to status slice when it's implemented
    // For now, just log
    // store.dispatch(updateUserStatus({ userId, status, lastSeen }));
  });

  // Call events (for future implementation)
  socket.on('incoming-call', ({ callId, caller, callType }) => {
    console.log('Incoming call:', { callId, caller, callType });
    // Dispatch to calls slice when it's implemented
    // store.dispatch(setIncomingCall({ callId, caller, callType }));
  });

  socket.on('call-accepted', ({ callId }) => {
    console.log('Call accepted:', { callId });
    // Dispatch to calls slice when it's implemented
    // store.dispatch(updateCallStatus({ callId, status: 'accepted' }));
  });

  socket.on('call-declined', ({ callId }) => {
    console.log('Call declined:', { callId });
    // Dispatch to calls slice when it's implemented
    // store.dispatch(updateCallStatus({ callId, status: 'declined' }));
  });

  socket.on('call-ended', ({ callId, duration }) => {
    console.log('Call ended:', { callId, duration });
    // Dispatch to calls slice when it's implemented
    // store.dispatch(endCall({ callId, duration }));
  });

  // WebRTC signaling events (for future implementation)
  socket.on('webrtc-offer', ({ callId }) => {
    console.log('WebRTC offer received:', { callId });
    // Handle in call manager
    // The offer parameter will be used when call manager is implemented
  });

  socket.on('webrtc-answer', ({ callId }) => {
    console.log('WebRTC answer received:', { callId });
    // Handle in call manager
    // The answer parameter will be used when call manager is implemented
  });

  socket.on('webrtc-ice-candidate', ({ callId }) => {
    console.log('WebRTC ICE candidate received:', { callId });
    // Handle in call manager
    // The candidate parameter will be used when call manager is implemented
  });

  // Story events (for future implementation)
  socket.on('story-added', (story) => {
    console.log('Story added:', story);
    // Dispatch to stories slice when it's implemented
    // store.dispatch(addStory(story));
  });

  socket.on('story-viewed', ({ storyId, viewerId }) => {
    console.log('Story viewed:', { storyId, viewerId });
    // Dispatch to stories slice when it's implemented
    // store.dispatch(addStoryViewer({ storyId, viewerId }));
  });

  return socket;
};

/**
 * Get the current socket instance
 * @returns {object|null} Socket instance or null if not initialized
 */
export const getSocket = () => {
  return socket;
};

/**
 * Check if socket is connected
 * @returns {boolean} Connection status
 */
export const isSocketConnected = () => {
  return isConnected && socket && socket.connected;
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
    reconnectAttempts = 0;
  }
};

/**
 * Emit a typing event
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID
 */
export const emitTyping = (chatId, userId) => {
  if (socket && isConnected) {
    socket.emit('typing', { chatId, userId });
  }
};

/**
 * Emit a stop typing event
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID
 */
export const emitStopTyping = (chatId, userId) => {
  if (socket && isConnected) {
    socket.emit('stop-typing', { chatId, userId });
  }
};

/**
 * Emit a message delivered event
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 */
export const emitMessageDelivered = (messageId, userId) => {
  if (socket && isConnected) {
    socket.emit('message-delivered', { messageId, userId });
  }
};

/**
 * Emit a message read event
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 */
export const emitMessageRead = (messageId, userId) => {
  if (socket && isConnected) {
    socket.emit('message-read', { messageId, userId });
  }
};

/**
 * Join a chat room
 * @param {string} chatId - Chat ID to join
 */
export const joinChat = (chatId) => {
  if (socket && isConnected) {
    socket.emit('join-chat', chatId);
  }
};

/**
 * Leave a chat room
 * @param {string} chatId - Chat ID to leave
 */
export const leaveChat = (chatId) => {
  if (socket && isConnected) {
    socket.emit('leave-chat', chatId);
  }
};

// Export socket instance for direct access if needed
export default {
  setupSocket,
  getSocket,
  isSocketConnected,
  disconnectSocket,
  emitTyping,
  emitStopTyping,
  emitMessageDelivered,
  emitMessageRead,
  joinChat,
  leaveChat,
};
