import { useEffect, useState } from 'react';
import { Bell, CheckCheck, AlertCircle, CheckCircle, XCircle, Package, CreditCard, MessageSquare, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Notification } from '../../types';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data as Notification[]);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(
        notifications.map((notif) =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconProps = 'w-5 h-5';
    const baseClass = 'flex-shrink-0';

    const iconMap: Record<string, JSX.Element> = {
      info: <AlertCircle className={`${iconProps} text-blue-500`} />,
      success: <CheckCircle className={`${iconProps} text-green-500`} />,
      warning: <AlertCircle className={`${iconProps} text-yellow-500`} />,
      error: <XCircle className={`${iconProps} text-red-500`} />,
      order: <Package className={`${iconProps} text-orange-500`} />,
      payment: <CreditCard className={`${iconProps} text-purple-500`} />,
      review: <MessageSquare className={`${iconProps} text-pink-500`} />,
    };

    return (
      <div className={`${baseClass} p-2 rounded-lg bg-gray-50`}>
        {iconMap[type] || iconMap['info']}
      </div>
    );
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            icon={<CheckCheck className="w-4 h-4" />}
            onClick={markAllAsRead}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="py-16 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-600">You'll see updates about your orders here</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              padding="md"
              className={`cursor-pointer transition-all ${
                !notif.is_read ? 'border-l-4 border-orange-500 bg-orange-50/30' : ''
              }`}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
            >
              <div className="flex items-start gap-4">
                {getNotificationIcon(notif.type)}

                <div className="flex-1">
                  <h3 className={`font-semibold text-gray-900 ${!notif.is_read ? 'font-bold' : ''}`}>
                    {notif.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notif.created_at).toLocaleDateString()} at{' '}
                    {new Date(notif.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!notif.is_read && (
                    <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
