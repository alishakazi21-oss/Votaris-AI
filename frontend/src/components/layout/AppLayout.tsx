import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { NotificationDrawer } from './NotificationDrawer';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base text-primary">
      {/* Collapsible / Responsive Sidebar */}
      <Sidebar />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopBar />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-8">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Tab Bar */}
        <BottomNav />
      </div>

      {/* Global Alerts & Notification Drawer */}
      <NotificationDrawer />
    </div>
  );
};
