import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { logout } from '../../features/authSlice';
import { setSearchOpen } from '../../features/uiSlice';
import GlobalSearch from '../search/GlobalSearch';

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { searchOpen } = useAppSelector((state) => state.ui);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <button
            onClick={() => dispatch(setSearchOpen(true))}
            className="flex items-center gap-2 w-full px-4 py-2 text-slate-400 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">Search...</span>
            <kbd className="ml-auto hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-white rounded border border-slate-300">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 ml-4">
          {/* Notifications */}
          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">
                {user?.fullName || 'User'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-200">
                  <p className="text-sm font-medium text-slate-900">{user?.fullName}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => dispatch(setSearchOpen(false))}
      />
    </>
  );
};

export default Header;
