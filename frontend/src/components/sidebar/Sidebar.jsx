import React, { useState } from 'react';
import { Search, MessageSquare, Plus } from 'lucide-react';

const mockUsers = [
  { id: 1, name: 'Caroline Gray', status: 'Online', unread: 0 },
  { id: 2, name: 'Matthew Walker', status: 'Online', unread: 4 },
  { id: 3, name: 'Carmen Jacobson', status: 'Online', unread: 0 },
  { id: 4, name: 'Presley Martin', status: 'Online', unread: 2 },
  { id: 5, name: 'Alexander Wilson', status: 'Offline', unread: 0 },
  { id: 6, name: 'Samuel White', status: 'Offline', unread: 0 },
];

const Sidebar = () => {
  const [activeUser, setActiveUser] = useState(4);

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
        {mockUsers.map((user) => (
          <div
            key={user.id}
            onClick={() => setActiveUser(user.id)}
            className={`mb-2 flex cursor-pointer items-center justify-between rounded-2xl p-3 transition-all ${
              activeUser === user.id ? 'bg-white/10 shadow-md' : 'hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-full bg-gray-600 overflow-hidden border-2 border-transparent">
                <img src={`https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} className="h-full w-full object-cover" />
                {user.status === 'Online' && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#191728] bg-green-500"></span>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-100">{user.name}</h3>
                <p className={`text-xs ${user.status === 'Online' ? 'text-green-400' : 'text-gray-400'}`}>
                  {user.status}
                </p>
              </div>
            </div>
            {user.unread > 0 && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                {user.unread}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Create New Group Button (mock) */}
      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-medium text-white transition-all hover:bg-white/10">
        <Plus size={16} /> Create New Group
      </button>
    </div>
  );
};

export default Sidebar;
