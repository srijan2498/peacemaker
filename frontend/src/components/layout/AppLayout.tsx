import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { FloatingAudioBar } from '../ui/FloatingAudioBar';

export const AppLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-cozy-bg dark:bg-cozy-darkBg text-cozy-text dark:text-cozy-darkText selection:bg-cozy-lavender selection:text-white">
      {/* Desktop Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-12">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Persistent Audio Player */}
      <FloatingAudioBar />

      {/* Bottom Mobile Navigation */}
      <MobileNav />
    </div>
  );
};
