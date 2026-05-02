import { Check, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';

/**
 * MessageStatus Component
 * 
 * Displays message delivery status with checkmarks:
 * - Single gray checkmark: "sent"
 * - Double gray checkmarks: "delivered"
 * - Double blue checkmarks: "read"
 * 
 * For group chats, status is clickable to show read receipt details
 */
const MessageStatus = ({ message, isGroupChat = false }) => {
  const [showReadReceipts, setShowReadReceipts] = useState(false);
  const { selectedChat } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);

  // Don't show status for messages we didn't send
  if (!message || message.sender._id !== user._id) {
    return null;
  }

  const status = message.status || 'sent';
  const readBy = message.readBy || [];

  // Get chat participants (excluding sender)
  const getParticipants = () => {
    if (!selectedChat || !isGroupChat) return [];
    return selectedChat.users.filter(u => u._id !== user._id);
  };

  const participants = getParticipants();

  // Determine which users have read the message
  const getReadStatus = () => {
    if (!isGroupChat) return null;
    
    const readUsers = participants.filter(p => 
      readBy.some(r => (r._id || r) === p._id)
    );
    const unreadUsers = participants.filter(p => 
      !readBy.some(r => (r._id || r) === p._id)
    );

    return { readUsers, unreadUsers };
  };

  const handleClick = () => {
    if (isGroupChat && (status === 'read' || status === 'delivered')) {
      setShowReadReceipts(!showReadReceipts);
    }
  };

  const renderStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        );
      
      case 'sent':
        return (
          <Check 
            size={14} 
            className="text-gray-400" 
            strokeWidth={2.5}
          />
        );
      
      case 'delivered':
        return (
          <CheckCheck 
            size={14} 
            className="text-gray-400" 
            strokeWidth={2.5}
          />
        );
      
      case 'read':
        return (
          <CheckCheck 
            size={14} 
            className="text-blue-500" 
            strokeWidth={2.5}
          />
        );
      
      default:
        return null;
    }
  };

  const readStatus = isGroupChat ? getReadStatus() : null;

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleClick}
        disabled={!isGroupChat || (status !== 'read' && status !== 'delivered')}
        className={`flex items-center ${
          isGroupChat && (status === 'read' || status === 'delivered')
            ? 'cursor-pointer hover:opacity-70 transition-opacity'
            : 'cursor-default'
        }`}
        title={
          isGroupChat && readStatus
            ? `Read by ${readStatus.readUsers.length}/${participants.length}`
            : status
        }
      >
        {renderStatusIcon()}
      </button>

      {/* Read Receipt Details Modal for Group Chats */}
      {showReadReceipts && isGroupChat && readStatus && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowReadReceipts(false)}
          />
          
          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-800 rounded-lg shadow-xl border border-white/10 w-80 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="text-white font-semibold">Read Receipts</h3>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-80">
              {/* Read by users */}
              {readStatus.readUsers.length > 0 && (
                <div className="p-4">
                  <h4 className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    Read by {readStatus.readUsers.length}
                  </h4>
                  <div className="space-y-2">
                    {readStatus.readUsers.map((user) => (
                      <div key={user._id} className="flex items-center gap-3">
                        <img 
                          src={user.pic} 
                          alt={user.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-white">{user.name}</p>
                        </div>
                        <CheckCheck 
                          size={14} 
                          className="text-blue-500" 
                          strokeWidth={2.5}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Not read by users */}
              {readStatus.unreadUsers.length > 0 && (
                <div className="p-4 border-t border-white/10">
                  <h4 className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    Delivered to {readStatus.unreadUsers.length}
                  </h4>
                  <div className="space-y-2">
                    {readStatus.unreadUsers.map((user) => (
                      <div key={user._id} className="flex items-center gap-3">
                        <img 
                          src={user.pic} 
                          alt={user.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-white">{user.name}</p>
                        </div>
                        <CheckCheck 
                          size={14} 
                          className="text-gray-400" 
                          strokeWidth={2.5}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Close button */}
            <div className="px-4 py-3 border-t border-white/10">
              <button
                onClick={() => setShowReadReceipts(false)}
                className="w-full py-2 bg-accent hover:bg-accent/80 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageStatus;
