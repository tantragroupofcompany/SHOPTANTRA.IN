import React, { useEffect, useState } from 'react';
import { Save, Eye, EyeOff, HardDrive, RotateCcw } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';

interface Settings {
  siteName: string;
  siteUrl: string;
  contactEmail: string;
  currency: string;
  gstRate: number;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  commissionBasic: number;
  commissionPro: number;
  commissionEnterprise: number;
  maintenanceMode: boolean;
}

const Settings = () => {
  const [settings, setSettings] = useState<Settings>({
    siteName: 'ShopTantra',
    siteUrl: 'https://shoptantra.com',
    contactEmail: 'support@shoptantra.com',
    currency: 'USD',
    gstRate: 18,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@shoptantra.com',
    commissionBasic: 10,
    commissionPro: 15,
    commissionEnterprise: 20,
    maintenanceMode: false,
  });

  const [editSettings, setEditSettings] = useState<Settings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'payment' | 'backup'>('general');

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('adminSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      setEditSettings(parsed);
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('adminSettings', JSON.stringify(editSettings));
    setSettings(editSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDiscard = () => {
    setEditSettings(settings);
  };

  const handleBackup = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      settings: editSettings,
    };
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-2">Configure platform settings and preferences</p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          Settings saved successfully!
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'text-orange-600 border-orange-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'email'
              ? 'text-orange-600 border-orange-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Email
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'payment'
              ? 'text-orange-600 border-orange-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Payment
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'backup'
              ? 'text-orange-600 border-orange-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Backup
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card>
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Site Name"
                value={editSettings.siteName}
                onChange={(e) => setEditSettings({ ...editSettings, siteName: e.target.value })}
              />
              <Input
                label="Site URL"
                type="url"
                value={editSettings.siteUrl}
                onChange={(e) => setEditSettings({ ...editSettings, siteUrl: e.target.value })}
              />
              <Input
                label="Contact Email"
                type="email"
                value={editSettings.contactEmail}
                onChange={(e) => setEditSettings({ ...editSettings, contactEmail: e.target.value })}
              />
              <Select
                label="Currency"
                value={editSettings.currency}
                onChange={(e) => setEditSettings({ ...editSettings, currency: e.target.value })}
              >
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>INR</option>
                <option>JPY</option>
              </Select>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">GST Rate</h3>
                  <p className="text-sm text-gray-600">Goods and Services Tax percentage</p>
                </div>
                <Input
                  type="number"
                  value={editSettings.gstRate}
                  onChange={(e) => setEditSettings({ ...editSettings, gstRate: parseFloat(e.target.value) })}
                  className="w-24"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Maintenance Mode</h3>
                  <p className="text-sm text-gray-600">Disable platform for all users except admins</p>
                </div>
                <button
                  onClick={() => setEditSettings({ ...editSettings, maintenanceMode: !editSettings.maintenanceMode })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    editSettings.maintenanceMode ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      editSettings.maintenanceMode ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-3 border-t pt-6">
              <Button onClick={handleSaveSettings} icon={<Save className="w-4 h-4" />}>
                Save Settings
              </Button>
              <Button variant="secondary" onClick={handleDiscard}>
                Discard Changes
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <Card>
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Email Configuration</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <strong>Note:</strong> Email settings are displayed for reference only. Changes are managed via secure environment variables.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="SMTP Host"
                value={editSettings.smtpHost}
                disabled
              />
              <Input
                label="SMTP Port"
                type="number"
                value={editSettings.smtpPort}
                disabled
              />
              <Input
                label="SMTP User"
                value={editSettings.smtpUser}
                disabled
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value="••••••••••••"
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <EyeOff className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Email</h3>
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="admin@shop.in"
                  className="flex-1"
                />
                <Button variant="secondary">Send Test Email</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Payment Settings */}
      {activeTab === 'payment' && (
        <Card>
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Payment Configuration</h2>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Commission Rates by Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Basic Plan (%)</label>
                  <Input
                    type="number"
                    value={editSettings.commissionBasic}
                    onChange={(e) => setEditSettings({ ...editSettings, commissionBasic: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Professional Plan (%)</label>
                  <Input
                    type="number"
                    value={editSettings.commissionPro}
                    onChange={(e) => setEditSettings({ ...editSettings, commissionPro: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enterprise Plan (%)</label>
                  <Input
                    type="number"
                    value={editSettings.commissionEnterprise}
                    onChange={(e) => setEditSettings({ ...editSettings, commissionEnterprise: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Gateway</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                Stripe integration is configured and active. All payments are processed securely.
              </div>
            </div>

            <div className="flex gap-3 border-t pt-6">
              <Button onClick={handleSaveSettings} icon={<Save className="w-4 h-4" />}>
                Save Settings
              </Button>
              <Button variant="secondary" onClick={handleDiscard}>
                Discard Changes
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Backup & Restore</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Backup */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <HardDrive className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Backup Data</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Create a backup of your current settings and configuration.
                </p>
                <Button onClick={handleBackup} className="w-full">
                  Create Backup
                </Button>
              </div>

              {/* Restore */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <RotateCcw className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Restore Data</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Restore settings from a previously created backup file.
                </p>
                <Button variant="secondary" className="w-full">
                  Select Backup File
                </Button>
              </div>
            </div>

            <div className="border-t mt-6 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Backups</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">settings_backup_2024-01-15.json</p>
                    <p className="text-xs text-gray-500">January 15, 2024 at 2:30 PM</p>
                  </div>
                  <Button variant="secondary" size="sm">
                    Download
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">settings_backup_2024-01-10.json</p>
                    <p className="text-xs text-gray-500">January 10, 2024 at 10:15 AM</p>
                  </div>
                  <Button variant="secondary" size="sm">
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Backup Modal */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="Backup Complete"
      >
        <div className="space-y-4">
          <div className="text-center py-6">
            <HardDrive className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Backup Created Successfully</h3>
            <p className="text-gray-600 mt-2">Your backup has been downloaded.</p>
          </div>
          <Button onClick={() => setShowBackupModal(false)} className="w-full">
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
