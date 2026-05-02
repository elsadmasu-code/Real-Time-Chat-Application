import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * MessageDeleteModal Component
 * Shows delete confirmation with "for-me"/"for-everyone" options
 * Checks 48-hour window for "delete for everyone" option
 */
const MessageDeleteModal = ({ message, onDelete, onCancel }) => {
  const [deleteType, setDeleteType] = useState('for-me');
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if message is within 48-hour window for "delete for everyone"
  const messageAge = new Date() - new Date(message.createdAt);
  const canDeleteForEveryone = messageAge < (48 * 60 * 60 * 1000); // 48 hours in milliseconds

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(deleteType);
    } catch (error) {
      console.error('Failed to delete message:', error);
      setIsDeleting(false);
    }
  };

  const formatTimeRemaining = () => {
    const hoursRemaining = Math.floor((48 * 60 * 60 * 1000 - messageAge) / (60 * 60 * 1000));
    const minutesRemaining = Math.floor(((48 * 60 * 60 * 1000 - messageAge) % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hoursRemaining > 0) {
      return `${hoursRemaining}h ${minutesRemaining}m remaining`;
    }
    return `${minutesRemaining}m remaining`;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onCancel}
      >
        {/* Modal */}
        <div 
          className="bg-gray-800 border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Delete Message</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Message Preview */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm text-gray-300 line-clamp-3">
                {message.content || (message.mediaType ? `[${message.mediaType} message]` : '[Empty message]')}
              </p>
            </div>

            {/* Delete Options */}
            <div className="space-y-2">
              {/* Delete for Me */}
              <label className="flex items-start gap-3 p-3 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                <input
                  type="radio"
                  name="deleteType"
                  value="for-me"
                  checked={deleteType === 'for-me'}
                  onChange={(e) => setDeleteType(e.target.value)}
                  className="mt-1 accent-accent"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Delete for me</div>
                  <div className="text-xs text-gray-400 mt-1">
                    This message will be removed from your chat, but others will still see it
                  </div>
                </div>
              </label>

              {/* Delete for Everyone */}
              <label className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                canDeleteForEveryone 
                  ? 'border-white/10 cursor-pointer hover:bg-white/5' 
                  : 'border-white/5 opacity-50 cursor-not-allowed'
              }`}>
                <input
                  type="radio"
                  name="deleteType"
                  value="for-everyone"
                  checked={deleteType === 'for-everyone'}
                  onChange={(e) => setDeleteType(e.target.value)}
                  disabled={!canDeleteForEveryone}
                  className="mt-1 accent-accent disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Delete for everyone</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {canDeleteForEveryone ? (
                      <>
                        This message will be removed for all chat participants
                        <span className="block mt-1 text-yellow-400">
                          {formatTimeRemaining()}
                        </span>
                      </>
                    ) : (
                      'You can only delete messages for everyone within 48 hours of sending'
                    )}
                  </div>
                </div>
              </label>
            </div>

            {/* Warning */}
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-xs text-yellow-400">
                ⚠️ This action cannot be undone
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10 bg-gray-900/50">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

MessageDeleteModal.propTypes = {
  message: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default MessageDeleteModal;
