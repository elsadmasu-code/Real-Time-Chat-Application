import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    pic: {
      type: String,
      default:
        'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    },
    
    // Status tracking
    status: { 
      type: String, 
      enum: ['online', 'offline', 'away'], 
      default: 'offline' 
    },
    lastSeen: { type: Date },
    
    // Privacy settings
    privacySettings: {
      showOnlineStatus: { type: Boolean, default: true },
      showLastSeen: { type: Boolean, default: true },
      showReadReceipts: { type: Boolean, default: true },
      storyVisibility: { 
        type: String, 
        enum: ['everyone', 'contacts'], 
        default: 'everyone' 
      }
    },
    
    // Notification preferences (per-chat stored in Chat model)
    notificationSettings: {
      enabled: { type: Boolean, default: true },
      sound: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;
