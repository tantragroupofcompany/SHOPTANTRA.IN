import { useEffect, useState } from 'react';
import { User, Lock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Profile as ProfileType } from '../../types';

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  const handleProfileChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setMessage('Profile updated successfully!');
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.new_password,
      });

      if (updateError) throw updateError;

      setMessage('Password changed successfully!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account information</p>
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

      {/* Profile Form */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-[#1B3A6B]" />
          <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
        </div>

        <form onSubmit={handleProfileChange} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Your full name"
            />
            <Input
              label="Email"
              value={user?.email || ''}
              disabled
              placeholder="Email (read-only)"
              hint="Email cannot be changed"
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 1234567890"
            />
            <Input
              label="Avatar URL"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Password Change */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-[#1B3A6B]" />
          <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          <Input
            label="Current Password"
            type="password"
            value={passwordData.current_password}
            onChange={(e) =>
              setPasswordData({ ...passwordData, current_password: e.target.value })
            }
            placeholder="Enter current password"
          />
          <Input
            label="New Password"
            type="password"
            value={passwordData.new_password}
            onChange={(e) =>
              setPasswordData({ ...passwordData, new_password: e.target.value })
            }
            placeholder="Enter new password"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={passwordData.confirm_password}
            onChange={(e) =>
              setPasswordData({ ...passwordData, confirm_password: e.target.value })
            }
            placeholder="Confirm new password"
          />

          <div className="flex justify-end">
            <Button type="submit" variant="danger" loading={passwordLoading}>
              Change Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
