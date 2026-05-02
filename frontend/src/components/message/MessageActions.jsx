import { useState } from 'react';
import { 
  Edit2, 
  Trash2, 
  Reply, 
  Forward, 
  Copy, 
  MoreVertical 
} from 'lucide-react';
import PropTypes from 'prop-types';
import ReactionBar from '../reactions/ReactionBar';
import EmojiPicker from '../reactions/EmojiPicker';

/**
 * MessageActions Component
 * Displays action menu on hover/long-press with edit/delete/reply/forward/copy/react buttons
 */
const MessageActions = ({ 
  message, 
  isOwnMessage, 
  onEdit, 
  onDelete, 
  onReply, 
  onForward, 
  onCopy, 
  onReact,
  currentUserId 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleReaction = (emoji) => {
    onReact(emoji);
    setShowReactions(false);
    setShowMenu(false);
    setShowEmojiPicker(false);
  };

  const handleMoreReactions = () => {
    setShowEmojiPicker(true);
    setShowReactions(false);
  };

  const handleAction = (action) => {
    action();
    setShowMenu(false);
  };

  // Get user's reactions for this message
  const userReactions = message.reactions
    ?.filter(r => (r.user?._id || r.user) === currentUserId)
    .map(r => r.emoji) || [];

  // Check if message can be edited (only text messages, own messages)
  const canEdit = isOwnMessage && !message.mediaType && message.content;

  // Check if message can be deleted for everyone (within 48 hours)
  const canDeleteForEveryone = isOwnMessage && 
    (new Date() - new Date(message.createdAt)) < (48 * 60 * 60 * 1000);

  // Check if message can be copied (has text content)
  const canCopy = message.content && message.content.trim().length > 0;

  return (
    <div className="message-actions relative">
      {/* Action Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        onMouseEnter={() => setShowReactions(true)}
        onMouseLeave={() => {
          // Delay hiding to allow moving to reaction bar
          setTimeout(() => setShowReactions(false), 200);
        }}
        className="action-trigger opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
        aria-label="Message actions"
      >
        <MoreVertical size={16} className="text-gray-400" />
      </button>

      {/* Quick Reaction Bar on Hover */}
      {showReactions && !showMenu && (
        <div 
          className={`absolute z-50 ${isOwnMessage ? 'right-0' : 'left-0'} -top-12`}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <ReactionBar
            onReact={handleReaction}
            onMoreReactions={handleMoreReactions}
            userReactions={userReactions}
          />
        </div>
      )}

      {/* Action Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className={`absolute z-50 mt-2 w-48 bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden ${
            isOwnMessage ? 'right-0' : 'left-0'
          }`}>
            {/* Action Buttons */}
            <div className="py-1">
              {/* Reply */}
              <button
                onClick={() => handleAction(onReply)}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors"
              >
                <Reply size={16} />
                <span>Reply</span>
              </button>

              {/* Forward */}
              <button
                onClick={() => handleAction(onForward)}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors"
              >
                <Forward size={16} />
                <span>Forward</span>
              </button>

              {/* Copy */}
              {canCopy && (
                <button
                  onClick={() => handleAction(onCopy)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                >
                  <Copy size={16} />
                  <span>Copy</span>
                </button>
              )}

              {/* Edit */}
              {canEdit && (
                <button
                  onClick={() => handleAction(onEdit)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                >
                  <Edit2 size={16} />
                  <span>Edit</span>
                </button>
              )}

              {/* Delete */}
              {isOwnMessage && (
                <button
                  onClick={() => handleAction(onDelete)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <EmojiPicker
          onEmojiSelect={handleReaction}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};

MessageActions.propTypes = {
  message: PropTypes.object.isRequired,
  isOwnMessage: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReply: PropTypes.func.isRequired,
  onForward: PropTypes.func.isRequired,
  onCopy: PropTypes.func.isRequired,
  onReact: PropTypes.func.isRequired,
  currentUserId: PropTypes.string.isRequired,
};

export default MessageActions;
