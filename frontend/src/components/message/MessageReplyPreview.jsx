import { X } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * MessageReplyPreview Component
 * Shows preview of message being replied to in the composer
 * Displays sender name, content preview (first 50 chars), and media thumbnail if applicable
 * Clickable to scroll to original message in chat
 */
const MessageReplyPreview = ({ replyToMessage, onClear, onClickOriginal }) => {
  if (!replyToMessage) return null;

  const getContentPreview = () => {
    if (replyToMessage.deletedForEveryone) {
      return 'Original message deleted';
    }
    
    if (replyToMessage.content) {
      return replyToMessage.content.length > 50 
        ? `${replyToMessage.content.substring(0, 50)}...` 
        : replyToMessage.content;
    }
    
    if (replyToMessage.mediaType) {
      const mediaTypeLabels = {
        image: '📷 Photo',
        video: '🎥 Video',
        voice: '🎤 Voice message',
        file: '📎 File',
      };
      return mediaTypeLabels[replyToMessage.mediaType] || 'Media';
    }
    
    return 'Message';
  };

  return (
    <div className="reply-preview-container p-3 bg-white/5 border border-white/10 rounded-lg mb-3">
      <div className="flex items-start gap-3">
        {/* Media Thumbnail */}
        {replyToMessage.mediaType && (replyToMessage.thumbnailUrl || replyToMessage.mediaUrl) && (
          <div className="flex-shrink-0">
            {replyToMessage.mediaType === 'image' && (
              <img
                src={replyToMessage.mediaUrl}
                alt="Reply preview"
                className="w-12 h-12 object-cover rounded"
              />
            )}
            {replyToMessage.mediaType === 'video' && (
              <img
                src={replyToMessage.thumbnailUrl || replyToMessage.mediaUrl}
                alt="Video preview"
                className="w-12 h-12 object-cover rounded"
              />
            )}
            {(replyToMessage.mediaType === 'voice' || replyToMessage.mediaType === 'file') && (
              <div className="w-12 h-12 bg-blue-500/20 rounded flex items-center justify-center">
                <span className="text-xl">
                  {replyToMessage.mediaType === 'voice' ? '🎤' : '📎'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div 
          className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onClickOriginal}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-8 bg-accent rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-accent">
                {replyToMessage.sender?.name || 'Unknown User'}
              </p>
              <p className="text-sm text-gray-300 truncate">
                {getContentPreview()}
              </p>
            </div>
          </div>
        </div>

        {/* Clear Button */}
        <button
          onClick={onClear}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          aria-label="Clear reply"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

MessageReplyPreview.propTypes = {
  replyToMessage: PropTypes.object,
  onClear: PropTypes.func.isRequired,
  onClickOriginal: PropTypes.func.isRequired,
};

export default MessageReplyPreview;
