import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { toggleSidebar } from '../../features/uiSlice';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Deals', href: '/deals', icon: Briefcase },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sidebarOpen } = useAppSelector((state) => state.ui);
  const location = useLocation();

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-primary-900 text-white transition-all duration-300 z-40',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-primary-800">
          {sidebarOpen && (
            <h1 className="text-xl font-bold">Nexus CRM</h1>
          )}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 rounded-lg hover:bg-primary-800 transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              item.href === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.href);

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-800 text-white'
                    : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Settings */}
        <div className="px-3 py-4 border-t border-primary-800">
          <NavLink
            to="/settings"
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              location.pathname === '/settings'
                ? 'bg-primary-800 text-white'
                : 'text-primary-200 hover:bg-primary-800 hover:text-white'
            )}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Settings</span>}
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
