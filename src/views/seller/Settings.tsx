import React, { useState, useEffect } from 'react';
import { Bell, Lock, Shield, Trash2, AlertTriangle, LogOut, Eye, EyeOff } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

interface NotificationPreference {
  newOrders: boolean;
  lowStock: boolean;
  payments: boolean;
  reviews: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
}

interface LoginHistory {
  id: string;
  date: string;
  device: string;
  location: string;
  status: 'success' | 'failed';
}

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreference>({
    newOrders: true,
    lowStock: true,
    payments: true,
    reviews: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const [activeSessions] = useState<ActiveSession[]>([
    {
      id: '1',
      device: 'MacBook Pro',
      browser: 'Chrome 120',
      location: 'New York, US',
      lastActive: '2024-12-13 14:30',
    },
    {
      id: '2',
      device: 'iPhone 14',
      browser: 'Safari',
      location: 'New York, US',
      lastActive: '2024-12-12 09:15',
    },
  ]);

  const [loginHistory] = useState<LoginHistory[]>([
    {
      id: '1',
      date: '2024-12-13 14:30',
      device: 'MacBook Pro',
      location: 'New York, US',
      status: 'success',
    },
    {
      id: '2',
      date: '2024-12-13 10:15',
      device: 'iPhone 14',
      location: 'New York, US',
      status: 'success',
    },
    {
      id: '3',
      date: '2024-12-12 23:45',
      device: 'Unknown',
      location: 'Moscow, RU',
      status: 'failed',
    },
  ]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load preferences from database
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchSettings = async () => {
      try {
        const response = await fetch(`/api/seller/settings?userId=${user.id}`);
        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.data) {
            if (resData.data.notificationPrefs) {
              setNotificationPrefs(resData.data.notificationPrefs);
            }
            setTwoFAEnabled(!!resData.data.twoFaEnabled);
          }
        }
      } catch (err) {
        console.error('Failed to load seller settings from DB:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [user]);

  // Save settings helper
  const saveSettings = async (prefs: NotificationPreference, twoFa: boolean) => {
    if (!user?.id) return;
    try {
      await fetch('/api/seller/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          notificationPrefs: prefs,
          twoFaEnabled: twoFa
        })
      });
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleNotificationChange = (key: keyof NotificationPreference) => {
    const updated = {
      ...notificationPrefs,
      [key]: !notificationPrefs[key],
    };
    setNotificationPrefs(updated);
    saveSettings(updated, twoFAEnabled);
  };

  const handleToggle2FA = () => {
    const updated2FA = !twoFAEnabled;
    setTwoFAEnabled(updated2FA);
    saveSettings(notificationPrefs, updated2FA);
  };

  const handleDeactivateStore = () => {
    console.log('Deactivating store...');
    setDeactivateModalOpen(false);
  };

  const handleDeleteAccount = () => {
    console.log('Deleting account...');
    setDeleteModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Notification Preferences */}
      <Card>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              Notification Preferences
            </h2>
            <p className="text-sm text-gray-600 mt-1">Manage how you receive notifications</p>
          </div>
        </div>

        <div className="space-y-4 border-t border-gray-200 pt-6">
          {/* Email/SMS toggles */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Notification Channels</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive updates via email</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('emailNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationPrefs.emailNotifications ? 'bg-orange-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationPrefs.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-600">Receive urgent updates via SMS</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('smsNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationPrefs.smsNotifications ? 'bg-orange-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationPrefs.smsNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Event toggles */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-900 mb-3">Notification Types</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">New Orders</p>
                  <p className="text-sm text-gray-600">Get notified when you receive new orders</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('newOrders')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationPrefs.newOrders ? 'bg-orange-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationPrefs.newOrders ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Low Stock Alerts</p>
                  <p className="text-sm text-gray-600">Get notified when products are running low</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('lowStock')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationPrefs.lowStock ? 'bg-orange-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationPrefs.lowStock ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Payment Updates</p>
                  <p className="text-sm text-gray-600">Get notified about payment status changes</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('payments')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationPrefs.payments ? 'bg-orange-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationPrefs.payments ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Customer Reviews</p>
                  <p className="text-sm text-gray-600">Get notified when you receive reviews</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('reviews')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationPrefs.reviews ? 'bg-orange-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationPrefs.reviews ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" />
              Security Settings
            </h2>
            <p className="text-sm text-gray-600 mt-1">Manage your account security</p>
          </div>
        </div>

        <div className="space-y-4 border-t border-gray-200 pt-6">
          {/* Two-FA Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Two-Factor Authentication
              </p>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
            <button
              onClick={handleToggle2FA}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${twoFAEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFAEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {twoFAEnabled && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                Two-Factor Authentication is enabled. You will need to enter a verification code when logging in.
              </p>
            </div>
          )}

          {/* Change Password */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <input type="password" placeholder="New password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              <input type="password" placeholder="Confirm new password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              <Button variant="primary" size="sm">Update Password</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Active Sessions */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Active Sessions</h2>
        <div className="space-y-4">
          {activeSessions.map(session => (
            <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="font-medium text-gray-900">{session.device}</p>
                <p className="text-sm text-gray-600">{session.browser} • {session.location}</p>
                <p className="text-xs text-gray-500 mt-1">Last active: {session.lastActive}</p>
              </div>
              <Button variant="outline" size="sm" icon={<LogOut className="w-4 h-4" />}>
                Logout
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Login History */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Login History</h2>
        <div className="space-y-3">
          {loginHistory.map(entry => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{entry.device}</p>
                  <Badge label={entry.status} variant={entry.status === 'success' ? 'success' : 'danger'} size="sm" />
                </div>
                <p className="text-sm text-gray-600">{entry.location}</p>
              </div>
              <p className="text-xs text-gray-500">{entry.date}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-500" />
          Privacy Settings
        </h2>
        <div className="space-y-3 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">Show online status</p>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-orange-500 transition-colors">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">Allow messaging from buyers</p>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-orange-500 transition-colors">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border border-red-200 bg-red-50">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Danger Zone
        </h2>
        <div className="space-y-4 border-t border-red-200 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Deactivate Store</p>
              <p className="text-sm text-gray-600">Your store will be temporarily disabled</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setDeactivateModalOpen(true)}>
              Deactivate
            </Button>
          </div>
          <div className="flex items-center justify-between border-t border-red-200 pt-4">
            <div>
              <p className="font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
            </div>
            <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => setDeleteModalOpen(true)}>
              Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Deactivate Modal */}
      <Modal isOpen={deactivateModalOpen} onClose={() => setDeactivateModalOpen(false)} title="Deactivate Store" size="sm">
        <div className="space-y-4">
          <p className="text-gray-700">Are you sure you want to deactivate your store? You can reactivate it anytime.</p>
          <div className="flex gap-3 pt-4">
            <Button variant="danger" onClick={handleDeactivateStore}>
              Deactivate Store
            </Button>
            <Button variant="outline" onClick={() => setDeactivateModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Account" size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900">This action cannot be undone. All your data will be permanently deleted.</p>
          </div>
          <p className="text-gray-700">Type your password to confirm account deletion:</p>
          <input type="password" placeholder="Enter your password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
          <div className="flex gap-3 pt-4">
            <Button variant="danger" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default function SafeSettings() {
  return (
    <ErrorBoundary>
      <Settings />
    </ErrorBoundary>
  );
}
