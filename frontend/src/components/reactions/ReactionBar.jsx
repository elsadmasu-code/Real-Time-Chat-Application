import { Smile } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * ReactionBar Component
 * Displays quick reaction emojis on message hover/long-press
 * Shows common emojis: thumbs up, heart, laugh, surprised, sad, angry
 * Includes "more reactions" button to open full emoji picker
 */
const ReactionBar = ({ onReact, onMoreReactions, userReactions = [] }) => {
  // Common quick reactions
  const quickReactions = [
    { emoji: '👍', label: 'thumbs up' },
    { emoji: '❤️', label: 'heart' },
    { emoji: '😂', label: 'laugh' },
    { emoji: '😮', label: 'surprised' },
    { emoji: '😢', label: 'sad' },
    { emoji: '😡', label: 'angry' },
  ];

  const handleReaction = (emoji) => {
    onReact(emoji);
  };

  return (
    <div className="flex items-center gap-1 p-2 bg-gray-800 border border-white/10 rounded-full shadow-xl">
      {/* Quick Reactions */}
      {quickReactions.map(({ emoji, label }) => {
        const isUserReacted = userReactions.includes(emoji);
        
        return (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            className={`text-xl hover:scale-125 transition-transform p-1 rounded-full ${
              isUserReacted ? 'bg-blue-500/20 ring-1 ring-blue-500' : 'hover:bg-white/10'
            }`}
            aria-label={`React with ${label}`}
            title={label}
          >
            {emoji}
          </button>
        );
      })}
      
      {/* More Reactions Button */}
      <button
        onClick={onMoreReactions}
        className="text-gray-400 hover:text-white hover:bg-white/10 transition-colors p-1 rounded-full ml-1"
        aria-label="More reactions"
        title="More reactions"
      >
        <Smile size={20} />
      </button>
    </div>
  );
};

ReactionBar.propTypes = {
  onReact: PropTypes.func.isRequired,
  onMoreReactions: PropTypes.func.isRequired,
  userReactions: PropTypes.arrayOf(PropTypes.string),
};

export default ReactionBar;
