import mongoose from 'mongoose';

const callSchema = mongoose.Schema(
  {
    caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    
    callType: { 
      type: String, 
      enum: ['voice', 'video'], 
      required: true 
    },
    
    status: { 
      type: String, 
      enum: ['ringing', 'accepted', 'declined', 'missed', 'ended'], 
      default: 'ringing' 
    },
    
    startedAt: { type: Date },
    endedAt: { type: Date },
    duration: { type: Number }, // seconds
    
    // WebRTC session data (for debugging)
    sessionId: { type: String }
  },
  { timestamps: true }
);

// Index on chat and createdAt for call history queries
callSchema.index({ chat: 1, createdAt: -1 });

const Call = mongoose.model('Call', callSchema);
export default Call;
