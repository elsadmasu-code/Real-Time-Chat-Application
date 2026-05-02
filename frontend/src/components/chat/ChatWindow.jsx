import { useEffect, useState, useRef, useCallback } from 'react';
import { MoreVertical, Mic, Image as ImageIcon, Send } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages, sendMessage, addMessage, updateMessage, deleteMessage, setReplyTo, clearReplyTo } from '../../store/slices/messageSlice';
import MediaUpload from '../media/MediaUpload';
import VoiceRecorder from '../media/VoiceRecorder';
import MediaDisplay from '../media/MediaDisplay';
import MessageActions from '../message/MessageActions';
import MessageEditForm from '../message/MessageEditForm';
import MessageDeleteModal from '../message/MessageDeleteModal';
import MessageReplyPreview from '../message/MessageReplyPreview';
import MessageForwardModal from '../message/MessageForwardModal';
import MessageStatus from '../message/MessageStatus';
import ReactionDisplay from '../reactions/ReactionDisplay';
import messageService from '../../services/messageService';
import { emitMessageDelivered, emitMessageRead } from '../../services/socket';
import io from 'socket.io-client';

const ENDPOINT = 'http://localhost:5000'; // backend url
let socket, selectedChatCompare;

const ChatWindow = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { selectedChat, chats } = useSelector((state) => state.chat);
  const messagesData = useSelector((state) => state.message.messages[selectedChat?._id]);
  const { replyTo } = useSelector((state) => state.message);
  const messages = messagesData?.items || [];
  const isLoading = messagesData?.loading || false;

  const [newMessage, setNewMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [deletingMessage, setDeletingMessage] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showToast, setShowToast] = useState(null);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const observerRef = useRef(null);
  const deliveredMessagesRef = useRef(new Set());
  const readMessagesRef = useRef(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit('setup', user);
    socket.on('connected', () => setSocketConnected(true));
    socket.on('typing', () => setIsTyping(true));
    socket.on('stop_typing', () => setIsTyping(false));

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      dispatch(fetchMessages(selectedChat._id));
      socket.emit('join_chat', selectedChat._id);
      selectedChatCompare = selectedChat;
    }
  }, [selectedChat, dispatch]);

  useEffect(() => {
    socket.on('message_received', (newMessageReceived) => {
      if (!selectedChatCompare || selectedChatCompare._id !== newMessageReceived.chat._id) {
        // Notification logic could go here
      } else {
        dispatch(addMessage(newMessageReceived));
        
        // Send delivered event for received messages (not our own)
        if (newMessageReceived.sender._id !== user._id && !deliveredMessagesRef.current.has(newMessageReceived._id)) {
          emitMessageDelivered(newMessageReceived._id, user._id);
          deliveredMessagesRef.current.add(newMessageReceived._id);
        }
      }
    });
  });

  // Setup Intersection Observer for read receipts
  useEffect(() => {
    if (!selectedChat || !user) return;

    // Create Intersection Observer to track when messages enter viewport
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId;
            const senderId = entry.target.dataset.senderId;
            
            // Only send read event for messages we didn't send
            if (messageId && senderId !== user._id && !readMessagesRef.current.has(messageId)) {
              emitMessageRead(messageId, user._id);
              readMessagesRef.current.add(messageId);
            }
          }
        });
      },
      {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.5, // 50% of message must be visible
      }
    );

    // Observe all message elements
    Object.values(messageRefs.current).forEach((element) => {
      if (element) {
        observerRef.current.observe(element);
      }
    });

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [selectedChat, user, messages]);

  // Send delivered events for existing messages when chat is opened
  useEffect(() => {
    if (!selectedChat || !user || !messages.length) return;

    messages.forEach((msg) => {
      // Send delivered event for messages we didn't send and haven't marked as delivered yet
      if (msg.sender._id !== user._id && !deliveredMessagesRef.current.has(msg._id)) {
        emitMessageDelivered(msg._id, user._id);
        deliveredMessagesRef.current.add(msg._id);
      }
    });
  }, [selectedChat, user, messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (newMessage || mediaPreview) {
        socket.emit('stop_typing', selectedChat._id);
        
        const messageData = { 
          content: newMessage, 
          chatId: selectedChat._id,
        };

        // Add reply reference if replying
        if (replyTo) {
          messageData.replyTo = replyTo._id;
        }

        // Add media data if present
        if (mediaPreview) {
          messageData.mediaType = mediaPreview.mediaType;
          messageData.mediaUrl = mediaPreview.mediaUrl;
          messageData.thumbnailUrl = mediaPreview.thumbnailUrl;
          messageData.fileName = mediaPreview.fileName;
          messageData.fileSize = mediaPreview.fileSize;
          messageData.duration = mediaPreview.duration;
        }

        setNewMessage('');
        setMediaPreview(null);
        dispatch(clearReplyTo());
        
        // Dispatch to backend and wait for response
        const { payload } = await dispatch(sendMessage(messageData));
        socket.emit('new_message', payload);
      }
    }
  };

  // Handle media upload
  const handleMediaUpload = (mediaData) => {
    setMediaPreview(mediaData);
    setShowMediaUpload(false);
    
    // If there's a caption, set it as the message
    if (mediaData.caption) {
      setNewMessage(mediaData.caption);
    }
  };

  // Handle voice recording
  const handleVoiceSend = (voiceData) => {
    setMediaPreview(voiceData);
    setShowVoiceRecorder(false);
    
    // Auto-send voice message
    setTimeout(() => {
      handleSendMessage({ type: 'click' });
    }, 100);
  };

  // Clear media preview
  const clearMediaPreview = () => {
    setMediaPreview(null);
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit('typing', selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit('stop_typing', selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  // Message action handlers
  const handleEditMessage = (message) => {
    setEditingMessage(message);
  };

  const handleSaveEdit = async (messageId, newContent) => {
    try {
      const updatedMessage = await messageService.editMessage(messageId, newContent, user.token);
      
      dispatch(updateMessage({
        chatId: selectedChat._id,
        messageId,
        updates: {
          content: newContent,
          isEdited: true,
          editedAt: new Date().toISOString(),
        },
      }));

      socket.emit('message_updated', updatedMessage);
      setEditingMessage(null);
      showToastMessage('Message edited');
    } catch (error) {
      console.error('Failed to edit message:', error);
      showToastMessage('Failed to edit message', 'error');
    }
  };

  const handleDeleteMessage = (message) => {
    setDeletingMessage(message);
  };

  const handleConfirmDelete = async (deleteType) => {
    try {
      await messageService.deleteMessage(deletingMessage._id, deleteType, user.token);
      
      dispatch(deleteMessage({
        chatId: selectedChat._id,
        messageId: deletingMessage._id,
        deletedForEveryone: deleteType === 'for-everyone',
      }));

      socket.emit('message_deleted', {
        messageId: deletingMessage._id,
        chatId: selectedChat._id,
        deletedForEveryone: deleteType === 'for-everyone',
      });

      setDeletingMessage(null);
      showToastMessage('Message deleted');
    } catch (error) {
      console.error('Failed to delete message:', error);
      showToastMessage('Failed to delete message', 'error');
    }
  };

  const handleReplyMessage = (message) => {
    dispatch(setReplyTo(message));
  };

  const handleScrollToMessage = (messageId) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('highlight-message');
      setTimeout(() => {
        messageElement.classList.remove('highlight-message');
      }, 2000);
    }
  };

  const handleForwardMessage = (message) => {
    setForwardingMessage(message);
  };

  const handleConfirmForward = async (chatIds) => {
    try {
      await messageService.forwardMessage(forwardingMessage._id, chatIds, user.token);
      
      setForwardingMessage(null);
      showToastMessage(`Message forwarded to ${chatIds.length} chat${chatIds.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Failed to forward message:', error);
      showToastMessage('Failed to forward message', 'error');
    }
  };

  const handleCopyMessage = async (message) => {
    const success = await messageService.copyMessageContent(message.content);
    if (success) {
      showToastMessage('Message copied');
    } else {
      showToastMessage('Failed to copy message', 'error');
    }
  };

  const handleReactMessage = async (message, emoji) => {
    try {
      const updatedMessage = await messageService.reactToMessage(message._id, emoji, user.token);
      
      // Update local state
      dispatch(updateMessage({
        chatId: selectedChat._id,
        messageId: message._id,
        updates: {
          reactions: updatedMessage.reactions,
        },
      }));

      socket.emit('reaction_updated', {
        messageId: message._id,
        chatId: selectedChat._id,
        reactions: updatedMessage.reactions,
      });
    } catch (error) {
      console.error('Failed to react to message:', error);
      showToastMessage('Failed to add reaction', 'error');
    }
  };

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  if (!selectedChat) {
    return (
      <div className="flex flex-1 items-center justify-center bg-chatBg/40">
        <p className="text-xl text-gray-400">Select a chat to start messaging</p>
      </div>
    );
  }

  const getSenderName = (loggedUser, users) => {
    return users[0]?._id === loggedUser?._id ? users[1]?.name : users[0]?.name;
  };

  const getSenderPic = (loggedUser, users) => {
    return users[0]?._id === loggedUser?._id ? users[1]?.pic : users[0]?.pic;
  };

  return (
    <div className="flex flex-1 flex-col bg-chatBg/40 relative">
      {/* Header */}
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden">
            <img 
              src={!selectedChat.isGroupChat ? getSenderPic(user, selectedChat.users) : 'https://cdn-icons-png.flaticon.com/512/3233/3233483.png'} 
              alt="avatar" 
              className="h-full w-full object-cover" 
            />
          </div>
          <div>
            <h2 className="font-semibold text-gray-100 flex items-center gap-2">
              {!selectedChat.isGroupChat ? getSenderName(user, selectedChat.users) : selectedChat.chatName}
              {!selectedChat.isGroupChat && <span className="h-2 w-2 rounded-full bg-green-500"></span>}
            </h2>
            {isTyping && <p className="text-xs text-green-400 animate-pulse">Typing...</p>}
          </div>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <p className="text-center text-gray-400">Loading messages...</p>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender._id === user._id;
            const isEditing = editingMessage?._id === msg._id;
            
            return (
              <div 
                key={msg._id || i} 
                ref={(el) => {
                  messageRefs.current[msg._id] = el;
                }}
                data-message-id={msg._id}
                data-sender-id={msg.sender._id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
              >
                {!isMe && (
                  <img src={msg.sender.pic} className="w-8 h-8 rounded-full mr-3 self-end" alt="avatar" />
                )}
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-md`}>
                  {selectedChat.isGroupChat && !isMe && (
                    <span className="text-[10px] text-gray-400 ml-1 mb-1">{msg.sender.name}</span>
                  )}
                  
                  {/* Reply Preview in Message */}
                  {msg.replyTo && (
                    <div 
                      className={`mb-2 p-2 rounded-lg border-l-2 cursor-pointer hover:opacity-80 transition-opacity ${
                        isMe ? 'bg-white/5 border-accent' : 'bg-white/10 border-blue-500'
                      }`}
                      onClick={() => handleScrollToMessage(msg.replyTo._id || msg.replyTo)}
                    >
                      <p className="text-[10px] text-accent font-medium">
                        {msg.replyTo.sender?.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {msg.replyTo.deletedForEveryone 
                          ? 'Original message deleted' 
                          : msg.replyTo.content?.substring(0, 50) || '[Media]'}
                      </p>
                    </div>
                  )}

                  {/* Forwarded Indicator */}
                  {msg.isForwarded && (
                    <div className="flex items-center gap-1 mb-1 text-[10px] text-gray-400">
                      <span>↪</span>
                      <span>Forwarded</span>
                    </div>
                  )}
                  
                  {/* Editing Mode */}
                  {isEditing ? (
                    <MessageEditForm
                      message={msg}
                      onSave={(newContent) => handleSaveEdit(msg._id, newContent)}
                      onCancel={() => setEditingMessage(null)}
                      isOwnMessage={isMe}
                    />
                  ) : (
                    <>
                      {/* Deleted Message */}
                      {msg.deletedForEveryone ? (
                        <div className={`rounded-2xl p-4 text-sm max-w-md shadow-sm border border-white/5 italic ${
                          isMe ? 'bg-bubblePrimary/50 text-gray-400' : 'bg-bubbleSecondary/50 text-gray-400'
                        }`}>
                          This message was deleted
                        </div>
                      ) : (
                        <>
                          {/* Media display */}
                          {msg.mediaType && msg.mediaUrl && (
                            <div className="mb-2">
                              <MediaDisplay message={msg} />
                            </div>
                          )}
                          
                          {/* Text content */}
                          {msg.content && (
                            <div className="relative">
                              <div 
                                className={`rounded-2xl p-4 text-sm max-w-md shadow-sm border border-white/5 ${
                                  isMe ? 'bg-bubblePrimary text-white rounded-br-sm' : 'bg-bubbleSecondary text-gray-200 rounded-bl-sm'
                                }`}
                              >
                                {msg.content}
                                
                                {/* Edited Indicator */}
                                {msg.isEdited && (
                                  <span className="text-[10px] text-gray-400 ml-2 italic">
                                    (edited)
                                  </span>
                                )}
                              </div>

                              {/* Message Actions */}
                              <div className={`absolute top-0 ${isMe ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} px-2`}>
                                <MessageActions
                                  message={msg}
                                  isOwnMessage={isMe}
                                  onEdit={() => handleEditMessage(msg)}
                                  onDelete={() => handleDeleteMessage(msg)}
                                  onReply={() => handleReplyMessage(msg)}
                                  onForward={() => handleForwardMessage(msg)}
                                  onCopy={() => handleCopyMessage(msg)}
                                  onReact={(emoji) => handleReactMessage(msg, emoji)}
                                  currentUserId={user._id}
                                />
                              </div>
                            </div>
                          )}

                          {/* Reactions Display */}
                          <ReactionDisplay
                            reactions={msg.reactions || []}
                            currentUserId={user._id}
                            onReactionClick={(emoji) => handleReactMessage(msg, emoji)}
                          />
                        </>
                      )}
                    </>
                  )}
                  
                  <span className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && (
                      <MessageStatus 
                        message={msg} 
                        isGroupChat={selectedChat.isGroupChat}
                      />
                    )}
                  </span>
                </div>
                
                {isMe && (
                  <img src={user.pic} className="w-8 h-8 rounded-full ml-3 self-end" alt="my avatar" />
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 px-6 border-t border-white/10 backdrop-blur-md">
        {/* Reply Preview */}
        {replyTo && (
          <MessageReplyPreview
            replyToMessage={replyTo}
            onClear={() => dispatch(clearReplyTo())}
            onClickOriginal={() => handleScrollToMessage(replyTo._id)}
          />
        )}

        {/* Media Preview */}
        {mediaPreview && (
          <div className="mb-3 p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {mediaPreview.mediaType === 'image' && (
                  <img 
                    src={mediaPreview.mediaUrl} 
                    alt="Preview" 
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                {mediaPreview.mediaType === 'video' && (
                  <video 
                    src={mediaPreview.mediaUrl} 
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                {(mediaPreview.mediaType === 'file' || mediaPreview.mediaType === 'voice') && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white">{mediaPreview.fileName || 'Voice message'}</p>
                      <p className="text-xs text-gray-400">
                        {mediaPreview.fileSize ? `${Math.round(mediaPreview.fileSize / 1024)} KB` : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={clearMediaPreview}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-2 px-4 focus-within:ring-1 focus-within:ring-accent transition-all">
          <input 
            type="text" 
            placeholder="Send a message" 
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 outline-none"
            value={newMessage}
            onChange={typingHandler}
            onKeyDown={handleSendMessage}
          />
          <button 
            onClick={() => setShowVoiceRecorder(true)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Mic size={18} />
          </button>
          <button 
            onClick={() => setShowMediaUpload(true)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ImageIcon size={18} />
          </button>
          <button onClick={handleSendMessage} className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent/80 transition-colors ml-1">
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Media Upload Modal */}
      {showMediaUpload && (
        <MediaUpload 
          onUpload={handleMediaUpload}
          onCancel={() => setShowMediaUpload(false)}
        />
      )}

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceRecorder 
          onSend={handleVoiceSend}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Delete Modal */}
      {deletingMessage && (
        <MessageDeleteModal
          message={deletingMessage}
          onDelete={handleConfirmDelete}
          onCancel={() => setDeletingMessage(null)}
        />
      )}

      {/* Forward Modal */}
      {forwardingMessage && (
        <MessageForwardModal
          message={forwardingMessage}
          chats={chats || []}
          currentUser={user}
          onForward={handleConfirmForward}
          onCancel={() => setForwardingMessage(null)}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className={`px-4 py-2 rounded-lg shadow-lg ${
            showToast.type === 'error' 
              ? 'bg-red-500 text-white' 
              : 'bg-green-500 text-white'
          }`}>
            {showToast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
