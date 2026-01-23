import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, ChevronDown, Search, X, Loader2, Check, CheckCheck, Trash2, Clock, FileText, Briefcase, FolderKanban, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { logout } from '../../features/authSlice';
import { markNotificationAsRead, markAllNotificationsAsRead, removePersistentNotification } from '../../features/uiSlice';
import { searchApi } from '../../services/api';

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { persistentNotifications } = useAppSelector((state) => state.ui);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = persistentNotifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setQuery('');
        setResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'deal':
        return <Briefcase className="w-4 h-4 text-purple-500" />;
      case 'project':
        return <FolderKanban className="w-4 h-4 text-blue-500" />;
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    dispatch(markNotificationAsRead(notification.id));
    if (notification.link) {
      navigate(notification.link);
      setNotificationsOpen(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await searchApi.global(searchQuery, 'all', 5);
      const data = response.data;

      // Flatten results into a single array with type information
      const flatResults = [
        ...data.companies.map((item: any) => ({ ...item, type: 'companies' })),
        ...data.contacts.map((item: any) => ({ ...item, type: 'contacts', name: item.fullName })),
        ...data.deals.map((item: any) => ({ ...item, type: 'deals' })),
        ...data.tasks.map((item: any) => ({ ...item, type: 'tasks' })),
      ];

      setResults(flatResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (type: string, id: string) => {
    setQuery('');
    setResults([]);
    navigate(`/${type}/${id}`);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Global Search */}
      <div className="relative flex-1 max-w-xl" ref={searchRef}>
        <div className="flex items-center gap-2 w-full px-4 py-2 text-slate-400 bg-slate-100 rounded-lg">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
          />
          {isLoading && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
          {query && (
            <button onClick={() => handleSearch('')}>
              <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {query.length >= 2 && results.length > 0 && (
          <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-2 max-h-96 overflow-y-auto">
            {results.map((result) => {
              const getTypeLabel = (type: string) => {
                const labels: Record<string, string> = {
                  companies: 'Company',
                  contacts: 'Contact',
                  deals: 'Deal',
                  tasks: 'Task',
                };
                return labels[type] || type;
              };

              const getTypeColor = (type: string) => {
                const colors: Record<string, string> = {
                  companies: 'bg-blue-100 text-blue-700',
                  contacts: 'bg-green-100 text-green-700',
                  deals: 'bg-purple-100 text-purple-700',
                  tasks: 'bg-orange-100 text-orange-700',
                };
                return colors[type] || 'bg-slate-100 text-slate-700';
              };

              return (
                <button
                  key={result.id}
                  onClick={() => handleNavigate(result.type, result.id)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${getTypeColor(result.type)}`}>
                      {getTypeLabel(result.type)}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {result.name}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 ml-4">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => dispatch(markAllNotificationsAsRead())}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {persistentNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No notifications</p>
                  </div>
                ) : (
                  persistentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${
                        !notification.isRead ? 'bg-primary-50/50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="text-left w-full"
                          >
                            <p className={`text-sm font-medium ${!notification.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </button>
                        </div>
                        <div className="flex-shrink-0 flex items-start gap-1">
                          {!notification.isRead && (
                            <button
                              onClick={() => dispatch(markNotificationAsRead(notification.id))}
                              className="p-1 text-slate-400 hover:text-primary-600 rounded"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => dispatch(removePersistentNotification(notification.id))}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {persistentNotifications.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
                  <button
                    onClick={() => {
                      navigate('/notifications');
                      setNotificationsOpen(false);
                    }}
                    className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
              {user?.fullName || 'Guest User'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-200">
                <p className="text-sm font-medium text-slate-900">{user?.fullName || 'Guest User'}</p>
                <p className="text-xs text-slate-500">{user?.email || 'No email available'}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role || 'No role assigned'}</p>
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
  );
};

export default Header;
