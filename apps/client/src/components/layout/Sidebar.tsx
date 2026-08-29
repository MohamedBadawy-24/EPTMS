import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Briefcase,
  Layers,
  HardHat,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const { user, isAdmin } = useAuth();

  const navItems: NavItem[] = [
    {
      name: 'Executive Dashboard',
      path: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Projects Portfolio',
      path: '/projects',
      icon: Briefcase,
    },
    {
      name: 'Procurement Control',
      path: '/procurement',
      icon: Layers,
    },
    {
      name: 'Contractor Scoring',
      path: '/contractors',
      icon: HardHat,
    },
    {
      name: 'Audit Trail',
      path: '/audit',
      icon: ShieldCheck,
      adminOnly: true,
    },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside
      className={cn(
        'relative bg-[#1E2229] text-white flex flex-col transition-all duration-300 ease-in-out border-r border-[#2C323B] z-30 shrink-0 h-screen sticky top-0',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-[#2C323B] justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-scb-blue flex items-center justify-center font-black text-white text-base tracking-wider shadow-md shrink-0 border border-blue-400/20">
              SCB
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm text-white tracking-wide truncate">Suez Canal Bank</span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Project Control</span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-9 h-9 rounded-lg bg-scb-blue flex items-center justify-center font-black text-white text-base tracking-wider shadow-md border border-blue-400/20">
              S
            </div>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all duration-150 group relative',
                  isActive
                    ? 'bg-scb-blue text-white shadow-sm font-semibold'
                    : 'text-gray-300 hover:bg-[#2A303A] hover:text-white',
                  isCollapsed && 'justify-center px-0'
                )
              }
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isCollapsed ? 'mx-auto' : '')} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
              {item.adminOnly && !isCollapsed && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-500/40">
                  ADMIN
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section Footer */}
      <div className="p-3 border-t border-[#2C323B] bg-[#181B20]">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-scb-blue/30 border border-scb-blue/50 text-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</span>
              <span className="text-[10px] text-gray-400 truncate">{user?.email || 'user@scb.com'}</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-scb-blue/30 border border-scb-blue/50 text-blue-200 flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#2C323B] text-gray-300 hover:text-white border border-[#444C57] flex items-center justify-center shadow-md transition-colors"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
};
