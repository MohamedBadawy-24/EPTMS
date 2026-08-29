import React, { useState } from 'react';
import { Search, LogOut, Shield, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';

export interface TopHeaderProps {
  onSearch?: (query: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onSearch }) => {
  const { user, logout } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-scb-warm/80 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-72 md:w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-scb-dark-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects, milestones, codes..."
            value={searchValue}
            onChange={handleSearchChange}
            className="w-full h-9 pl-9 pr-3 text-xs bg-scb-offwhite/80 border border-scb-warm rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-scb-blue focus:border-scb-blue transition-all"
          />
        </div>
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* System Health Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-medium text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Live</span>
        </div>

        {/* Role Badge */}
        {user?.role && (
          <Badge variant={user.role === 'ADMIN' ? 'admin' : 'viewer'} size="md">
            {user.role === 'ADMIN' ? (
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                ADMIN
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                VIEWER
              </span>
            )}
          </Badge>
        )}

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-scb-offwhite border border-transparent hover:border-scb-warm transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-scb-blue text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-scb-dark leading-tight">{user?.name || 'Bank User'}</span>
              <span className="text-[10px] text-scb-dark-muted leading-tight">{user?.email || 'Engineering Dept'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-scb-dark-muted hidden md:block" />
          </button>

          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-scb-warm shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2.5 border-b border-scb-warm/50">
                <p className="text-xs font-bold text-scb-dark">{user?.name}</p>
                <p className="text-[11px] text-scb-dark-muted truncate">{user?.email}</p>
                <div className="mt-1.5">
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-scb-warm/40 text-scb-dark">
                    Role: {user?.role}
                  </span>
                </div>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
