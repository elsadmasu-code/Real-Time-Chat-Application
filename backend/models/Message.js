import mongoose from 'mongoose';

const messageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Message status
    status: { 
      type: String, 
      enum: ['sending', 'sent', 'delivered', 'read'], 
      default: 'sent' 
    },
    
    // Media fields
    mediaType: { 
      type: String, 
      enum: ['image', 'video', 'file', 'voice', null],
      default: null
    },
    mediaUrl: { type: String },
    thumbnailUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    duration: { type: Number }, // For voice/video in seconds
    
    // Message actions
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    editHistory: [{
      content: String,
      editedAt: Date
    }],
    
    // Deletion tracking
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    deletedForEveryone: { type: Boolean, default: false },
    deletedAt: { type: Date },
    
    // Reactions
    reactions: [{
      emoji: { type: String, required: true },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      createdAt: { type: Date, default: Date.now }
    }],
    
    // Forwarding
    isForwarded: { type: Boolean, default: false },
    originalMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    forwardedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Indexes for performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ content: 'text' }); // Full-text search

const Message = mongoose.model('Message', messageSchema);
export default Message;
