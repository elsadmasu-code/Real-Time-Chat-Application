import React from 'react';
import { MoreVertical, Mic, Paperclip, Send, Image as ImageIcon } from 'lucide-react';

const mockMessages = [
  { id: 1, text: 'Lorem ipsum is placeholder text commonly used in.', sender: 'them', time: '3:45 PM' },
  { id: 2, text: 'Lorem ipsum is placeholder text commonly used in.', sender: 'me', time: '3:48 PM' },
  { id: 3, text: 'Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing.', sender: 'them', time: '5:00 PM' },
  { id: 4, text: 'Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing.', sender: 'me', time: '5:02 PM', isVoice: true },
];

const ChatWindow = () => {
  return (
    <div className="flex flex-1 flex-col bg-chatBg/40 relative">
      {/* Header */}
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden">
            <img src="https://i.pravatar.cc/150?u=4" alt="John Johnson" className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-100 flex items-center gap-2">
              John Johnson <span className="h-2 w-2 rounded-full bg-green-500"></span>
            </h2>
            <p className="text-xs text-green-400">John Johnson typing...</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {mockMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'them' && (
              <img src="https://i.pravatar.cc/150?u=4" className="w-8 h-8 rounded-full mr-3 self-end" alt="avatar" />
            )}
            
            {msg.isVoice ? (
               <div className="flex items-center gap-3 rounded-2xl bg-bubbleSecondary p-3 text-sm text-gray-200 backdrop-blur-sm max-w-md shadow-sm border border-white/5">
                 <div className="h-8 w-8 bg-accent rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-accent/80 transition-colors">
                    <div className="w-1 h-3 bg-white rounded-full mx-[1px]"></div>
                    <div className="w-1 h-5 bg-white rounded-full mx-[1px]"></div>
                    <div className="w-1 h-3 bg-white rounded-full mx-[1px]"></div>
                 </div>
                 <div>
                    <p className="font-medium">Voice Message (0:15)</p>
                    <p className="text-xs text-gray-400 mt-1">{msg.time}</p>
                 </div>
                 <div className="ml-4 h-8 w-8 bg-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                   <Mic size={14} />
                 </div>
               </div>
            ) : (
              <div className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`rounded-2xl p-4 text-sm max-w-md shadow-sm border border-white/5 ${
                    msg.sender === 'me' ? 'bg-bubblePrimary text-white rounded-br-sm' : 'bg-bubbleSecondary text-gray-200 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-xs text-gray-500 mt-1">{msg.time}</span>
              </div>
            )}
            
            {msg.sender === 'me' && (
              <img src="https://i.pravatar.cc/150?u=0" className="w-8 h-8 rounded-full ml-3 self-end" alt="my avatar" />
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 px-6 border-t border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-2 px-4 focus-within:ring-1 focus-within:ring-accent transition-all">
          <input 
            type="text" 
            placeholder="Send a message" 
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 outline-none"
          />
          <button className="text-gray-400 hover:text-white transition-colors">
            <Mic size={18} />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <ImageIcon size={18} />
          </button>
          <button className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent/80 transition-colors ml-1">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
