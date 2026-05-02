import User from '../models/User.js';

// Update user status
export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    if (!status || !['online', 'offline', 'away'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "online", "offline", or "away"' });
    }

    // Find and update user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's status field
    user.status = status;

    // If status is "offline", set lastSeen to current timestamp
    if (status === 'offline') {
      user.lastSeen = new Date();
    }

    await user.save();

    // Return updated user (without password)
    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user status
export const getUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await User.findById(userId).select('status lastSeen privacySettings');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check privacy settings
    if (user.privacySettings && user.privacySettings.showOnlineStatus === false) {
      // User has disabled status visibility
      return res.json({
        status: 'offline',
        lastSeen: null,
        privacyEnabled: true
      });
    }

    // Return user status
    res.json({
      status: user.status,
      lastSeen: user.lastSeen,
      privacyEnabled: false
    });
  } catch (error) {
    console.error('Error getting user status:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update privacy settings
export const updatePrivacySettings = async (req, res) => {
  try {
    const { showOnlineStatus, showLastSeen, showReadReceipts, storyVisibility } = req.body;

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update privacy settings
    if (showOnlineStatus !== undefined) {
      user.privacySettings.showOnlineStatus = showOnlineStatus;
    }
    if (showLastSeen !== undefined) {
      user.privacySettings.showLastSeen = showLastSeen;
    }
    if (showReadReceipts !== undefined) {
      user.privacySettings.showReadReceipts = showReadReceipts;
    }
    if (storyVisibility !== undefined) {
      if (!['everyone', 'contacts'].includes(storyVisibility)) {
        return res.status(400).json({ message: 'storyVisibility must be "everyone" or "contacts"' });
      }
      user.privacySettings.storyVisibility = storyVisibility;
    }

    await user.save();

    // Return updated user (without password)
    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req, res) => {
  try {
    const { enabled, sound } = req.body;

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update notification settings
    if (enabled !== undefined) {
      user.notificationSettings.enabled = enabled;
    }
    if (sound !== undefined) {
      user.notificationSettings.sound = sound;
    }

    await user.save();

    // Return updated user (without password)
    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: error.message });
  }
};
