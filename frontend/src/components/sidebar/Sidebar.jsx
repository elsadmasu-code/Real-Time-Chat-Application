import React, { useEffect } from 'react';
import { Search, MessageSquare, Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChats, setSelectedChat } from '../../store/slices/chatSlice';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { chats, selectedChat, isLoading } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  const getSenderName = (loggedUser, users) => {
    return users[0]?._id === loggedUser?._id ? users[1]?.name : users[0]?.name;
  };

  const getSenderPic = (loggedUser, users) => {
    return users[0]?._id === loggedUser?._id ? users[1]?.pic : users[0]?.pic;
  };

  return (
    <div className="flex h-full w-80 flex-col border-r border-white/10 bg-sidebarBg p-4 sm:w-96">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
          <MessageSquare size={20} />
        </div>
        <h1 className="text-xl font-bold tracking-wide">QuickChat</h1>
      </div>

      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          className="w-full rounded-2xl bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-400 outline-none transition-all focus:bg-white/10 focus:ring-1 focus:ring-accent"
          placeholder="Search here..."
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {isLoading ? (
          <p className="text-center text-gray-400">Loading chats...</p>
        ) : chats && chats.length > 0 ? (
          chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => dispatch(setSelectedChat(chat))}
              className={`mb-2 flex cursor-pointer items-center justify-between rounded-2xl p-3 transition-all ${
                selectedChat?._id === chat._id ? 'bg-white/10 shadow-md' : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-full bg-gray-600 overflow-hidden border-2 border-transparent">
                  <img 
                    src={!chat.isGroupChat ? getSenderPic(user, chat.users) : 'https://cdn-icons-png.flaticon.com/512/3233/3233483.png'} 
                    alt="avatar" 
                    className="h-full w-full object-cover" 
                  />
                  {/* Simplified online status for now */}
                  {!chat.isGroupChat && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#191728] bg-green-500"></span>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-100">
                    {!chat.isGroupChat ? getSenderName(user, chat.users) : chat.chatName}
                  </h3>
                  <p className="text-xs text-gray-400 truncate w-32">
                    {chat.latestMessage ? chat.latestMessage.content : 'New chat'}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400 text-sm mt-4">No chats found. Search to start one!</p>
        )}
      </div>
      
      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-medium text-white transition-all hover:bg-white/10">
        <Plus size={16} /> Create New Group
      </button>
    </div>
  );
};

export default Sidebar;
