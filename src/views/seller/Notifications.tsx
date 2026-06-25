import React, { useState, useEffect } from 'react';
import { Check, CheckCheck, Package, DollarSign, Star, Trash2, Filter, Inbox } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

interface Notification {
  id: string;
  type: 'order' | 'payment' | 'review' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/seller/notifications?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const filteredNotifications = filterType === 'all'
    ? notifications
    : filterType === 'unread'
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => n.type === filterType);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-orange-500" />;
      case 'payment':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'review':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'system':
        return <Inbox className="w-5 h-5 text-blue-500" />;
      default:
        return <Inbox className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationBadgeVariant = (type: string) => {
    switch (type) {
      case 'order':
        return 'info';
      case 'payment':
        return 'success';
      case 'review':
        return 'warning';
      case 'system':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/seller/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'read',
          notificationId: id
        })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    setMarkingAllRead(true);
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    try {
      const res = await fetch('/api/seller/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'read_all',
          ids: unreadIds
        })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/seller/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'delete',
          notificationId: id
        })
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleDeleteAll = async () => {
    if (!user?.id) return;
    const allIds = notifications.map(n => n.id);
    try {
      const res = await fetch('/api/seller/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'delete_all',
          ids: allIds
        })
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to delete all notifications:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              You have <span className="font-semibold text-orange-600">{unreadCount}</span> unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" icon={<CheckCheck className="w-4 h-4" />} onClick={handleMarkAllAsRead} disabled={markingAllRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-4 overflow-x-auto">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${filterType === 'all' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('unread')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${filterType === 'unread' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          Unread
          {unreadCount > 0 && <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">{unreadCount}</span>}
        </button>
        <button
          onClick={() => setFilterType('order')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${filterType === 'order' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          <Package className="w-4 h-4" />
          Orders
        </button>
        <button
          onClick={() => setFilterType('payment')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${filterType === 'payment' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          <DollarSign className="w-4 h-4" />
          Payments
        </button>
        <button
          onClick={() => setFilterType('review')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${filterType === 'review' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          <Star className="w-4 h-4" />
          Reviews
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card className="py-12">
          <div className="text-center">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No notifications</h3>
            <p className="text-gray-500 text-sm">
              {filterType === 'all'
                ? 'You are all caught up!'
                : filterType === 'unread'
                  ? 'No unread notifications'
                  : `No ${filterType} notifications`}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(notification => (
            <Card
              key={notification.id}
              className={`transition-all ${!notification.read ? 'bg-orange-50 border-orange-200' : ''}`}
              padding="md"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold text-gray-900 ${!notification.read ? 'font-bold' : ''}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-500">{notification.created_at}</p>
                    </div>
                    <Badge label={notification.type} variant={getNotificationBadgeVariant(notification.type)} size="sm" />
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Check className="w-4 h-4" />}
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="Mark as read"
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4 text-red-500" />}
                    onClick={() => handleDelete(notification.id)}
                    title="Delete"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete All Button */}
      {notifications.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={handleDeleteAll}>
            Delete All Notifications
          </Button>
        </div>
      )}
    </div>
  );
};

export default function SafeNotifications() {
  return (
    <ErrorBoundary>
      <Notifications />
    </ErrorBoundary>
  );
}
