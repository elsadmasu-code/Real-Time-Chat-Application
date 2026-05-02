import { Server } from 'socket.io';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

let io;

// Store user socket mappings
const userSockets = new Map(); // userId -> socketId
const typingTimeouts = new Map(); // chatId-userId -> timeoutId

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('setup', async (userData) => {
            if(userData && userData._id) {
                socket.join(userData._id);
                socket.userId = userData._id;
                userSockets.set(userData._id, socket.id);
                socket.emit('connected');
                console.log('User joined their personal room:', userData._id);
                
                // Update user status to online
                try {
                    const user = await User.findByIdAndUpdate(
                        userData._id,
                        { status: 'online' },
                        { new: true }
                    ).select('_id status lastSeen privacySettings');
                    
                    // Broadcast status change to connected users (respecting privacy settings)
                    if (user && user.privacySettings.showOnlineStatus) {
                        socket.broadcast.emit('user-status-changed', {
                            userId: user._id,
                            status: user.status,
                            lastSeen: user.lastSeen
                        });
                    }
                } catch (error) {
                    console.error('Error updating user status on connection:', error);
                }
            }
        });

        socket.on('join_chat', (room) => {
            socket.join(room);
            console.log('User Joined Room:', room);
        });

        // ===== TYPING INDICATORS =====
        socket.on('typing', async ({ chatId, userId }) => {
            try {
                // Clear existing timeout for this user in this chat
                const timeoutKey = `${chatId}-${userId}`;
                if (typingTimeouts.has(timeoutKey)) {
                    clearTimeout(typingTimeouts.get(timeoutKey));
                }
                
                // Add user to typing users in chat
                await Chat.findByIdAndUpdate(
                    chatId,
                    { $addToSet: { typingUsers: userId } }
                );
                
                // Broadcast to other users in the chat
                socket.to(chatId).emit('user-typing', { chatId, userId });
                
                // Set 3-second timeout to auto-stop typing
                const timeout = setTimeout(async () => {
                    await Chat.findByIdAndUpdate(
                        chatId,
                        { $pull: { typingUsers: userId } }
                    );
                    socket.to(chatId).emit('user-stopped-typing', { chatId, userId });
                    typingTimeouts.delete(timeoutKey);
                }, 3000);
                
                typingTimeouts.set(timeoutKey, timeout);
            } catch (error) {
                console.error('Error handling typing event:', error);
            }
        });

        socket.on('stop-typing', async ({ chatId, userId }) => {
            try {
                // Clear timeout if exists
                const timeoutKey = `${chatId}-${userId}`;
                if (typingTimeouts.has(timeoutKey)) {
                    clearTimeout(typingTimeouts.get(timeoutKey));
                    typingTimeouts.delete(timeoutKey);
                }
                
                // Remove user from typing users
                await Chat.findByIdAndUpdate(
                    chatId,
                    { $pull: { typingUsers: userId } }
                );
                
                // Broadcast to other users in the chat
                socket.to(chatId).emit('user-stopped-typing', { chatId, userId });
            } catch (error) {
                console.error('Error handling stop-typing event:', error);
            }
        });

        // ===== MESSAGE EVENTS =====
        socket.on('new_message', (newMessageReceived) => {
            var chat = newMessageReceived.chat;

            if (!chat || !chat.users) return console.log('chat.users not defined');

            chat.users.forEach((user) => {
                if (user._id == newMessageReceived.sender._id) return;
                socket.in(user._id).emit('message_received', newMessageReceived);
            });
        });

        socket.on('message-sent', (message) => {
            if (!message.chat || !message.chat.users) {
                return console.log('chat.users not defined');
            }
            
            // Broadcast to all chat participants except sender
            message.chat.users.forEach((user) => {
                if (user._id.toString() !== message.sender._id.toString()) {
                    socket.in(user._id.toString()).emit('message-received', message);
                }
            });
            
            // Auto-stop typing for sender
            if (message.sender && message.chat._id) {
                const timeoutKey = `${message.chat._id}-${message.sender._id}`;
                if (typingTimeouts.has(timeoutKey)) {
                    clearTimeout(typingTimeouts.get(timeoutKey));
                    typingTimeouts.delete(timeoutKey);
                }
                
                Chat.findByIdAndUpdate(
                    message.chat._id,
                    { $pull: { typingUsers: message.sender._id } }
                ).catch(err => console.error('Error removing typing user:', err));
            }
        });

        socket.on('message-updated', async ({ messageId, chatId }) => {
            try {
                const message = await Message.findById(messageId)
                    .populate('sender', 'name pic')
                    .populate('chat');
                
                if (message && message.chat) {
                    // Broadcast to all chat participants
                    message.chat.users.forEach((userId) => {
                        socket.in(userId.toString()).emit('message-updated', message);
                    });
                }
            } catch (error) {
                console.error('Error handling message-updated event:', error);
            }
        });

        socket.on('message-deleted', async ({ messageId, chatId, deletedForEveryone }) => {
            try {
                const chat = await Chat.findById(chatId);
                
                if (chat) {
                    // Broadcast to all chat participants
                    chat.users.forEach((userId) => {
                        socket.in(userId.toString()).emit('message-deleted', {
                            messageId,
                            deletedForEveryone
                        });
                    });
                }
            } catch (error) {
                console.error('Error handling message-deleted event:', error);
            }
        });

        socket.on('message-delivered', async ({ messageId, userId }) => {
            try {
                const message = await Message.findByIdAndUpdate(
                    messageId,
                    { status: 'delivered' },
                    { new: true }
                ).populate('sender', '_id');
                
                if (message) {
                    // Broadcast to sender
                    socket.in(message.sender._id.toString()).emit('message-status-updated', {
                        messageId: message._id,
                        status: message.status
                    });
                }
            } catch (error) {
                console.error('Error handling message-delivered event:', error);
            }
        });

        socket.on('message-read', async ({ messageId, userId }) => {
            try {
                const message = await Message.findById(messageId)
                    .populate('sender', '_id')
                    .populate('chat');
                
                if (!message) return;
                
                // Check user's privacy settings
                const user = await User.findById(userId).select('privacySettings');
                if (!user || !user.privacySettings.showReadReceipts) {
                    return; // Don't update read status if user has disabled read receipts
                }
                
                // Add user to readBy array
                if (!message.readBy.includes(userId)) {
                    message.readBy.push(userId);
                }
                
                // Update status based on chat type
                if (message.chat.isGroupChat) {
                    // For group chats, set to "read" only when all participants (except sender) have read
                    const otherUsers = message.chat.users.filter(
                        u => u.toString() !== message.sender._id.toString()
                    );
                    const allRead = otherUsers.every(u => 
                        message.readBy.some(r => r.toString() === u.toString())
                    );
                    if (allRead) {
                        message.status = 'read';
                    }
                } else {
                    // For one-on-one chats, set to "read" immediately
                    message.status = 'read';
                }
                
                await message.save();
                
                // Broadcast to sender
                socket.in(message.sender._id.toString()).emit('message-status-updated', {
                    messageId: message._id,
                    status: message.status,
                    readBy: message.readBy
                });
            } catch (error) {
                console.error('Error handling message-read event:', error);
            }
        });

        // ===== REACTION EVENTS =====
        socket.on('add-reaction', async ({ messageId, emoji, userId }) => {
            try {
                const message = await Message.findById(messageId).populate('chat');
                
                if (!message) return;
                
                // Add reaction
                message.reactions.push({
                    emoji,
                    user: userId,
                    createdAt: new Date()
                });
                
                await message.save();
                
                // Broadcast to all chat participants
                message.chat.users.forEach((chatUserId) => {
                    socket.in(chatUserId.toString()).emit('reaction-added', {
                        messageId,
                        reaction: { emoji, user: userId, createdAt: new Date() }
                    });
                });
            } catch (error) {
                console.error('Error handling add-reaction event:', error);
            }
        });

        socket.on('remove-reaction', async ({ messageId, emoji, userId }) => {
            try {
                const message = await Message.findById(messageId).populate('chat');
                
                if (!message) return;
                
                // Remove reaction
                message.reactions = message.reactions.filter(
                    r => !(r.emoji === emoji && r.user.toString() === userId.toString())
                );
                
                await message.save();
                
                // Broadcast to all chat participants
                message.chat.users.forEach((chatUserId) => {
                    socket.in(chatUserId.toString()).emit('reaction-removed', {
                        messageId,
                        emoji,
                        userId
                    });
                });
            } catch (error) {
                console.error('Error handling remove-reaction event:', error);
            }
        });

        // ===== CALL SIGNALING EVENTS =====
        socket.on('call-initiate', async ({ callId, receiverId, callType }) => {
            try {
                // Send incoming-call notification to receiver
                socket.in(receiverId).emit('incoming-call', {
                    callId,
                    callType
                });
            } catch (error) {
                console.error('Error handling call-initiate event:', error);
            }
        });

        socket.on('call-accept', async ({ callId, callerId }) => {
            try {
                // Notify caller of acceptance
                socket.in(callerId).emit('call-accepted', { callId });
            } catch (error) {
                console.error('Error handling call-accept event:', error);
            }
        });

        socket.on('call-decline', async ({ callId, callerId }) => {
            try {
                // Notify caller of decline
                socket.in(callerId).emit('call-declined', { callId });
            } catch (error) {
                console.error('Error handling call-decline event:', error);
            }
        });

        socket.on('call-end', async ({ callId, otherUserId, duration }) => {
            try {
                // Notify other party of call end
                socket.in(otherUserId).emit('call-ended', { callId, duration });
            } catch (error) {
                console.error('Error handling call-end event:', error);
            }
        });

        // WebRTC signaling events
        socket.on('webrtc-offer', ({ callId, offer, receiverId }) => {
            socket.in(receiverId).emit('webrtc-offer', { callId, offer });
        });

        socket.on('webrtc-answer', ({ callId, answer, callerId }) => {
            socket.in(callerId).emit('webrtc-answer', { callId, answer });
        });

        socket.on('webrtc-ice-candidate', ({ callId, candidate, targetUserId }) => {
            socket.in(targetUserId).emit('webrtc-ice-candidate', { callId, candidate });
        });

        // ===== STORY EVENTS =====
        socket.on('story-added', async ({ story, relevantUserIds }) => {
            try {
                // Broadcast to relevant users based on privacy settings
                relevantUserIds.forEach((userId) => {
                    socket.in(userId.toString()).emit('story-added', story);
                });
            } catch (error) {
                console.error('Error handling story-added event:', error);
            }
        });

        socket.on('story-viewed', async ({ storyId, viewerId, storyCreatorId }) => {
            try {
                // Notify story creator
                socket.in(storyCreatorId).emit('story-viewed', {
                    storyId,
                    viewerId
                });
            } catch (error) {
                console.error('Error handling story-viewed event:', error);
            }
        });

        // ===== DISCONNECTION =====
        socket.on('disconnect', async () => {
            console.log('User disconnected:', socket.id);
            
            // Update user status to offline and set lastSeen
            if (socket.userId) {
                try {
                    const user = await User.findByIdAndUpdate(
                        socket.userId,
                        { 
                            status: 'offline',
                            lastSeen: new Date()
                        },
                        { new: true }
                    ).select('_id status lastSeen privacySettings');
                    
                    // Broadcast status change to connected users (respecting privacy settings)
                    if (user && user.privacySettings.showOnlineStatus) {
                        socket.broadcast.emit('user-status-changed', {
                            userId: user._id,
                            status: user.status,
                            lastSeen: user.lastSeen
                        });
                    }
                    
                    // Clean up user socket mapping
                    userSockets.delete(socket.userId);
                } catch (error) {
                    console.error('Error updating user status on disconnection:', error);
                }
            }
        });
    });
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};
