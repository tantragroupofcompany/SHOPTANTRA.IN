import { useState } from 'react';
import { Lock, Bell, Shield, Globe, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';

interface PreferenceState {
  newsletter: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  notificationEmails: boolean;
  smsNotifications: boolean;
  profileVisibility: boolean;
  showActivity: boolean;
}

const Settings = () => {
  const { user, signOut } = useAuth();
  const [preferences, setPreferences] = useState<PreferenceState>({
    newsletter: true,
    orderUpdates: true,
    promotions: false,
    notificationEmails: true,
    smsNotifications: false,
    profileVisibility: true,
    showActivity: false,
  });
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('INR');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePreferenceChange = (key: keyof PreferenceState) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setMessage('Preferences updated!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (deletePassword.trim() === '' || deleteConfirm !== 'DELETE MY ACCOUNT') {
      setError('Please confirm by typing "DELETE MY ACCOUNT" and enter your password');
      return;
    }

    try {
      // In a real scenario, you'd verify the password with Supabase
      // For now, just show a confirmation and sign out
      setMessage('Account deletion initiated. You will be signed out.');
      setTimeout(async () => {
        await signOut();
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  const PreferenceToggle = ({
    label,
    description,
    id,
  }: {
    label: string;
    description: string;
    id: keyof PreferenceState;
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-gray-100 last:border-b-0">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => handlePreferenceChange(id)}
        className={`ml-4 px-4 py-2 rounded-lg font-medium transition-all ${
          preferences[id]
            ? 'bg-orange-500 text-white'
            : 'bg-gray-200 text-gray-700'
        }`}
      >
        {preferences[id] ? 'ON' : 'OFF'}
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account preferences</p>
      </div>

      {message && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Email Preferences */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-[#1B3A6B]" />
          <h2 className="text-xl font-bold text-gray-900">Email Preferences</h2>
        </div>

        <div className="space-y-0">
          <PreferenceToggle
            id="newsletter"
            label="Newsletter Subscription"
            description="Receive curated products and stories from ShopTantra"
          />
          <PreferenceToggle
            id="orderUpdates"
            label="Order Updates"
            description="Get notifications about your orders"
          />
          <PreferenceToggle
            id="promotions"
            label="Promotional Emails"
            description="Receive special offers and discounts"
          />
          <PreferenceToggle
            id="notificationEmails"
            label="Notification Emails"
            description="Receive support responses and important alerts"
          />
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-[#1B3A6B]" />
          <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
        </div>

        <div className="space-y-0">
          <PreferenceToggle
            id="smsNotifications"
            label="SMS Notifications"
            description="Receive order and delivery updates via SMS"
          />
        </div>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-[#1B3A6B]" />
          <h2 className="text-xl font-bold text-gray-900">Privacy Settings</h2>
        </div>

        <div className="space-y-0">
          <PreferenceToggle
            id="profileVisibility"
            label="Profile Visibility"
            description="Allow sellers to see your profile and review history"
          />
          <PreferenceToggle
            id="showActivity"
            label="Show Recent Activity"
            description="Display your recent purchases on your profile"
          />
        </div>
      </Card>

      {/* Language & Currency */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-5 h-5 text-[#1B3A6B]" />
          <h2 className="text-xl font-bold text-gray-900">Language & Currency</h2>
        </div>

        <div className="space-y-6">
          <Select
            label="Language"
            options={[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'Hindi' },
              { value: 'mr', label: 'Marathi' },
              { value: 'gu', label: 'Gujarati' },
              { value: 'ta', label: 'Tamil' },
              { value: 'te', label: 'Telugu' },
              { value: 'kn', label: 'Kannada' },
              { value: 'ml', label: 'Malayalam' },
            ]}
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setMessage('Language preference updated!');
              setTimeout(() => setMessage(''), 3000);
            }}
          />

          <Select
            label="Currency"
            options={[
              { value: 'INR', label: 'Indian Rupee (₹)' },
              { value: 'USD', label: 'US Dollar ($)' },
              { value: 'EUR', label: 'Euro (€)' },
              { value: 'GBP', label: 'British Pound (£)' },
            ]}
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              setMessage('Currency preference updated!');
              setTimeout(() => setMessage(''), 3000);
            }}
          />
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50/30">
        <div className="flex items-center gap-3 mb-6">
          <Trash2 className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Deleting your account is permanent and cannot be undone. All your data, orders, and reviews will be deleted.
          </p>

          <Button
            variant="danger"
            onClick={() => setIsDeletingAccount(true)}
          >
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Delete Account Modal */}
      <Modal
        isOpen={isDeletingAccount}
        onClose={() => {
          setIsDeletingAccount(false);
          setDeletePassword('');
          setDeleteConfirm('');
          setError('');
        }}
        title="Delete Your Account"
        size="lg"
      >
        <form onSubmit={handleDeleteAccount} className="space-y-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-semibold mb-2">This action cannot be undone!</p>
            <p className="text-xs text-red-600">
              Deleting your account will permanently remove all your data including orders, wishlists, addresses, and support tickets.
            </p>
          </div>

          <Input
            label="Enter Your Password"
            type="password"
            placeholder="Confirm your password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            required
          />

          <Input
            label="Type to Confirm"
            placeholder="Type: DELETE MY ACCOUNT"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            hint={deleteConfirm.length > 0 && deleteConfirm !== 'DELETE MY ACCOUNT' ? 'Must match exactly' : undefined}
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeletingAccount(false);
                setDeletePassword('');
                setDeleteConfirm('');
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={
                deletePassword.trim() === '' ||
                deleteConfirm !== 'DELETE MY ACCOUNT'
              }
            >
              Permanently Delete Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
