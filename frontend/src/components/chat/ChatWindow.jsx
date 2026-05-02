import React, { useEffect, useState, useRef } from 'react';
import { MoreVertical, Mic, Image as ImageIcon, Send } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages, sendMessage, addMessage } from '../../store/slices/messageSlice';
import io from 'socket.io-client';

const ENDPOINT = 'http://localhost:5000'; // backend url
let socket, selectedChatCompare;

const ChatWindow = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { selectedChat } = useSelector((state) => state.chat);
  const { messages, isLoading } = useSelector((state) => state.message);

  const [newMessage, setNewMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

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
      }
    });
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (newMessage) {
        socket.emit('stop_typing', selectedChat._id);
        const messageData = { content: newMessage, chatId: selectedChat._id };
        setNewMessage('');
        
        // Dispatch to backend and wait for response
        const { payload } = await dispatch(sendMessage(messageData));
        socket.emit('new_message', payload);
      }
    }
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
            return (
              <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <img src={msg.sender.pic} className="w-8 h-8 rounded-full mr-3 self-end" alt="avatar" />
                )}
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {selectedChat.isGroupChat && !isMe && (
                    <span className="text-[10px] text-gray-400 ml-1 mb-1">{msg.sender.name}</span>
                  )}
                  <div 
                    className={`rounded-2xl p-4 text-sm max-w-md shadow-sm border border-white/5 ${
                      isMe ? 'bg-bubblePrimary text-white rounded-br-sm' : 'bg-bubbleSecondary text-gray-200 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-2 px-4 focus-within:ring-1 focus-within:ring-accent transition-all">
          <input 
            type="text" 
            placeholder="Send a message" 
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 outline-none"
            value={newMessage}
            onChange={typingHandler}
            onKeyDown={handleSendMessage}
          />
          <button className="text-gray-400 hover:text-white transition-colors">
            <Mic size={18} />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <ImageIcon size={18} />
          </button>
          <button onClick={handleSendMessage} className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent/80 transition-colors ml-1">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
