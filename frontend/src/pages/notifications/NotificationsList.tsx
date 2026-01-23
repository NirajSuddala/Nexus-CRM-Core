import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, Clock, FileText, Briefcase, FolderKanban, AlertCircle, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removePersistentNotification,
  clearPersistentNotifications,
} from '../../features/uiSlice';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../../components/ui';

const NotificationsList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { persistentNotifications } = useAppSelector((state) => state.ui);

  const unreadCount = persistentNotifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'deal':
        return <Briefcase className="w-5 h-5 text-purple-500" />;
      case 'project':
        return <FolderKanban className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'task': return 'Task';
      case 'deal': return 'Deal';
      case 'project': return 'Project';
      case 'success': return 'Success';
      case 'warning': return 'Warning';
      case 'error': return 'Error';
      case 'system': return 'System';
      default: return 'Info';
    }
  };

  const getNotificationTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'task': return 'bg-orange-100 text-orange-700';
      case 'deal': return 'bg-purple-100 text-purple-700';
      case 'project': return 'bg-blue-100 text-blue-700';
      case 'success': return 'bg-green-100 text-green-700';
      case 'warning': return 'bg-amber-100 text-amber-700';
      case 'error': return 'bg-red-100 text-red-700';
      case 'system': return 'bg-slate-100 text-slate-700';
      default: return 'bg-cyan-100 text-cyan-700';
    }
  };

  const handleNotificationClick = (notification: any) => {
    dispatch(markNotificationAsRead(notification.id));
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-500">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CheckCheck className="w-4 h-4" />}
              onClick={() => dispatch(markAllNotificationsAsRead())}
            >
              Mark all as read
            </Button>
          )}
          {persistentNotifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => dispatch(clearPersistentNotifications())}
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            All Notifications ({persistentNotifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {persistentNotifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No notifications</h3>
              <p className="text-slate-500">You're all caught up! Check back later for updates.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {persistentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-6 py-4 hover:bg-slate-50 transition-colors ${
                    !notification.isRead ? 'bg-primary-50/30' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded ${getNotificationTypeBadgeColor(
                                notification.type
                              )}`}
                            >
                              {getNotificationTypeLabel(notification.type)}
                            </span>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-primary-500 rounded-full" />
                            )}
                          </div>
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="text-left w-full"
                          >
                            <p
                              className={`font-medium ${
                                !notification.isRead ? 'text-slate-900' : 'text-slate-600'
                              }`}
                            >
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p className="text-sm text-slate-500 mt-1">
                                {notification.message}
                              </p>
                            )}
                          </button>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            <span>
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                            <span>
                              {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <button
                              onClick={() => dispatch(markNotificationAsRead(notification.id))}
                              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => dispatch(removePersistentNotification(notification.id))}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsList;
