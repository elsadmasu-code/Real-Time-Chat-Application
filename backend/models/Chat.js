import mongoose from 'mongoose';

const chatModel = mongoose.Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Per-user notification settings
    mutedBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      mutedUntil: { type: Date } // null for permanent mute
    }],
    
    // Typing indicators (stored temporarily, could also be socket-only)
    typingUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

const Chat = mongoose.model('Chat', chatModel);
export default Chat;
