import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Reactions indexed by message ID
  // Structure: { [messageId]: [{ emoji, users: [userId1, userId2], count }] }
  reactions: {},
};

export const reactionsSlice = createSlice({
  name: 'reactions',
  initialState,
  reducers: {
    // Add a reaction to a message
    addReaction: (state, action) => {
      const { messageId, emoji, userId } = action.payload;
      
      // Initialize reactions for this message if not exists
      if (!state.reactions[messageId]) {
        state.reactions[messageId] = [];
      }
      
      // Find existing reaction with this emoji
      const existingReaction = state.reactions[messageId].find(
        (r) => r.emoji === emoji
      );
      
      if (existingReaction) {
        // Add user to existing reaction if not already present
        if (!existingReaction.users.includes(userId)) {
          existingReaction.users.push(userId);
          existingReaction.count = existingReaction.users.length;
        }
      } else {
        // Create new reaction entry
        state.reactions[messageId].push({
          emoji,
          users: [userId],
          count: 1,
        });
      }
    },
    
    // Remove a reaction from a message
    removeReaction: (state, action) => {
      const { messageId, emoji, userId } = action.payload;
      
      if (!state.reactions[messageId]) {
        return;
      }
      
      // Find the reaction with this emoji
      const reactionIndex = state.reactions[messageId].findIndex(
        (r) => r.emoji === emoji
      );
      
      if (reactionIndex !== -1) {
        const reaction = state.reactions[messageId][reactionIndex];
        
        // Remove user from the reaction
        reaction.users = reaction.users.filter((id) => id !== userId);
        reaction.count = reaction.users.length;
        
        // If no users left, remove the reaction entirely
        if (reaction.users.length === 0) {
          state.reactions[messageId].splice(reactionIndex, 1);
        }
        
        // If no reactions left for this message, clean up
        if (state.reactions[messageId].length === 0) {
          delete state.reactions[messageId];
        }
      }
    },
    
    // Set all reactions for a message (replaces existing)
    setReactions: (state, action) => {
      const { messageId, reactions } = action.payload;
      
      // Transform reactions array from backend format to frontend format
      // Backend: [{ emoji, user, createdAt }]
      // Frontend: [{ emoji, users: [userId], count }]
      
      const groupedReactions = {};
      
      reactions.forEach((reaction) => {
        const emoji = reaction.emoji;
        const userId = reaction.user._id || reaction.user;
        
        if (!groupedReactions[emoji]) {
          groupedReactions[emoji] = {
            emoji,
            users: [],
            count: 0,
          };
        }
        
        groupedReactions[emoji].users.push(userId);
        groupedReactions[emoji].count++;
      });
      
      state.reactions[messageId] = Object.values(groupedReactions);
    },
    
    // Clear all reactions for a message
    clearReactions: (state, action) => {
      const { messageId } = action.payload;
      delete state.reactions[messageId];
    },
    
    // Clear all reactions (for cleanup)
    clearAllReactions: (state) => {
      state.reactions = {};
    },
  },
});

export const {
  addReaction,
  removeReaction,
  setReactions,
  clearReactions,
  clearAllReactions,
} = reactionsSlice.actions;

export default reactionsSlice.reducer;
