import mongoose from 'mongoose';

const storySchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mediaType: { 
      type: String, 
      enum: ['image', 'video'], 
      required: true 
    },
    mediaUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    
    // Expiration
    expiresAt: { 
      type: Date, 
      required: true,
      index: true // For efficient cleanup queries
    },
    
    // Viewers
    viewedBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      viewedAt: { type: Date, default: Date.now }
    }],
    
    // Cloudinary public_id for deletion
    cloudinaryPublicId: { type: String, required: true }
  },
  { timestamps: true }
);

// TTL index for automatic deletion
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index on user and expiresAt for queries
storySchema.index({ user: 1, expiresAt: 1 });

const Story = mongoose.model('Story', storySchema);
export default Story;
