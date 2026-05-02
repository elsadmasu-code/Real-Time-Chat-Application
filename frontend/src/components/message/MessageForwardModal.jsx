import { useState } from 'react';
import { Forward, X, Search, Check } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * MessageForwardModal Component
 * Chat selection modal for forwarding messages
 * Supports multiple destination selection
 * Shows "forwarded" indicator on forwarded messages
 */
const MessageForwardModal = ({ message, chats, currentUser, onForward, onCancel }) => {
  const [selectedChats, setSelectedChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) => {
    const chatName = chat.isGroupChat 
      ? chat.chatName 
      : chat.users.find(u => u._id !== currentUser._id)?.name || 'Unknown';
    
    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleChatSelection = (chatId) => {
    setSelectedChats((prev) => {
      if (prev.includes(chatId)) {
        return prev.filter((id) => id !== chatId);
      }
      return [...prev, chatId];
    });
  };

  const handleForward = async () => {
    if (selectedChats.length === 0) return;

    setIsForwarding(true);
    try {
      await onForward(selectedChats);
    } catch (error) {
      console.error('Failed to forward message:', error);
      setIsForwarding(false);
    }
  };

  const getChatName = (chat) => {
    if (chat.isGroupChat) {
      return chat.chatName;
    }
    const otherUser = chat.users.find(u => u._id !== currentUser._id);
    return otherUser?.name || 'Unknown';
  };

  const getChatPic = (chat) => {
    if (chat.isGroupChat) {
      return 'https://cdn-icons-png.flaticon.com/512/3233/3233483.png';
    }
    const otherUser = chat.users.find(u => u._id !== currentUser._id);
    return otherUser?.pic || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';
  };

  const getMessagePreview = () => {
    if (message.content) {
      return message.content.length > 100 
        ? `${message.content.substring(0, 100)}...` 
        : message.content;
    }
    
    if (message.mediaType) {
      const mediaTypeLabels = {
        image: '📷 Photo',
        video: '🎥 Video',
        voice: '🎤 Voice message',
        file: `📎 ${message.fileName || 'File'}`,
      };
      return mediaTypeLabels[message.mediaType] || 'Media';
    }
    
    return 'Message';
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
          className="bg-gray-800 border border-white/10 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Forward size={20} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Forward Message</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Message Preview */}
          <div className="p-4 border-b border-white/10 bg-gray-900/50">
            <div className="flex items-start gap-3">
              {message.mediaType && (message.thumbnailUrl || message.mediaUrl) && (
                <div className="flex-shrink-0">
                  {message.mediaType === 'image' && (
                    <img
                      src={message.mediaUrl}
                      alt="Message preview"
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  {message.mediaType === 'video' && (
                    <img
                      src={message.thumbnailUrl || message.mediaUrl}
                      alt="Video preview"
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300">
                  {getMessagePreview()}
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-accent transition-all"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p>No chats found</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredChats.map((chat) => {
                  const isSelected = selectedChats.includes(chat._id);
                  
                  return (
                    <label
                      key={chat._id}
                      className="flex items-center gap-3 p-4 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleChatSelection(chat._id)}
                        className="hidden"
                      />
                      
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-accent border-accent' 
                          : 'border-gray-500'
                      }`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>

                      {/* Avatar */}
                      <img
                        src={getChatPic(chat)}
                        alt={getChatName(chat)}
                        className="w-10 h-10 rounded-full object-cover"
                      />

                      {/* Chat Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {getChatName(chat)}
                        </p>
                        {chat.isGroupChat && (
                          <p className="text-xs text-gray-400">
                            {chat.users.length} members
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-white/10 bg-gray-900/50">
            <p className="text-sm text-gray-400">
              {selectedChats.length > 0 
                ? `${selectedChats.length} chat${selectedChats.length > 1 ? 's' : ''} selected` 
                : 'Select chats to forward to'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                disabled={isForwarding}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleForward}
                disabled={isForwarding || selectedChats.length === 0}
                className="px-4 py-2 text-sm bg-accent hover:bg-accent/80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isForwarding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Forwarding...</span>
                  </>
                ) : (
                  <>
                    <Forward size={16} />
                    <span>Forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

MessageForwardModal.propTypes = {
  message: PropTypes.object.isRequired,
  chats: PropTypes.array.isRequired,
  currentUser: PropTypes.object.isRequired,
  onForward: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default MessageForwardModal;
