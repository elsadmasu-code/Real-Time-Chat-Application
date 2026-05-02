import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * ReactionDisplay Component
 * Displays reaction counts below message grouped by emoji
 * Shows emoji and count for each reaction type
 * Clickable to show list of users who reacted
 * Highlights reactions from current user
 */
const ReactionDisplay = ({ reactions = [], currentUserId, onReactionClick }) => {
  const [showUsersModal, setShowUsersModal] = useState(null);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const emoji = reaction.emoji;
    const userId = reaction.user?._id || reaction.user;
    const userName = reaction.user?.name || 'Unknown User';
    
    if (!acc[emoji]) {
      acc[emoji] = {
        emoji,
        users: [],
        count: 0,
        hasCurrentUser: false,
      };
    }
    
    acc[emoji].users.push({ id: userId, name: userName });
    acc[emoji].count++;
    
    if (userId === currentUserId) {
      acc[emoji].hasCurrentUser = true;
    }
    
    return acc;
  }, {});

  const reactionGroups = Object.values(groupedReactions);

  if (reactionGroups.length === 0) {
    return null;
  }

  const handleReactionClick = (emoji) => {
    // Toggle reaction for current user
    if (onReactionClick) {
      onReactionClick(emoji);
    }
  };

  const handleShowUsers = (e, reactionGroup) => {
    e.stopPropagation();
    setShowUsersModal(reactionGroup);
  };

  const handleCloseModal = () => {
    setShowUsersModal(null);
  };

  return (
    <>
      <div className="flex flex-wrap gap-1 mt-2">
        {reactionGroups.map((reactionGroup) => (
          <button
            key={reactionGroup.emoji}
            onClick={() => handleReactionClick(reactionGroup.emoji)}
            onContextMenu={(e) => handleShowUsers(e, reactionGroup)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
              reactionGroup.hasCurrentUser
                ? 'bg-blue-500/30 hover:bg-blue-500/40 ring-1 ring-blue-500'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            title="Click to react, right-click to see who reacted"
          >
            <span className="text-sm">{reactionGroup.emoji}</span>
            <span className={`text-xs ${
              reactionGroup.hasCurrentUser ? 'text-blue-300 font-medium' : 'text-gray-400'
            }`}>
              {reactionGroup.count}
            </span>
          </button>
        ))}
      </div>

      {/* Users Modal */}
      {showUsersModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50" 
            onClick={handleCloseModal}
          />
          
          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-800 border border-white/10 rounded-lg shadow-xl p-4 min-w-[250px] max-w-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{showUsersModal.emoji}</span>
                <span className="text-sm text-gray-400">
                  {showUsersModal.count} {showUsersModal.count === 1 ? 'reaction' : 'reactions'}
                </span>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {showUsersModal.users.map((user, index) => (
                <div 
                  key={`${user.id}-${index}`}
                  className="flex items-center gap-2 p-2 rounded hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-200">
                    {user.name}
                    {user.id === currentUserId && (
                      <span className="text-xs text-blue-400 ml-1">(You)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

ReactionDisplay.propTypes = {
  reactions: PropTypes.arrayOf(
    PropTypes.shape({
      emoji: PropTypes.string.isRequired,
      user: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          _id: PropTypes.string,
          name: PropTypes.string,
        }),
      ]).isRequired,
    })
  ),
  currentUserId: PropTypes.string.isRequired,
  onReactionClick: PropTypes.func,
};

export default ReactionDisplay;
