import React from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';

const Dashboard = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center p-4 sm:p-8">
      {/* Main App Container */}
      <div className="glass flex h-full w-full max-w-7xl overflow-hidden rounded-3xl">
        <Sidebar />
        <ChatWindow />
      </div>
    </div>
  );
};

export default Dashboard;
