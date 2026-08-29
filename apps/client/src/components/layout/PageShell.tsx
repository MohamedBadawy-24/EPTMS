import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

export interface PageShellProps {
  children?: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-scb-offwhite">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
