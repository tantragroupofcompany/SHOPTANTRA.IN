import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { Seller } from '../../types';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

const StoreSettings = () => {
  const { user } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [formData, setFormData] = useState({
    store_name: '',
    store_description: '',
    business_type: '',
    gst_number: '',
    pan_number: '',
  });
  const [bankData, setBankData] = useState({
    bank_account_number: '',
    bank_ifsc: '',
    bank_account_name: '',
  });
  const [addressData, setAddressData] = useState({
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessages, setSuccessMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSellerData = async () => {
      if (!user) return;

      try {
        const res = await fetch(`/api/seller/store-settings?userId=${user.id}`);
        if (!res.ok) {
          throw new Error('Failed to load store settings from API');
        }
        const resData = await res.json();

        if (resData.success && resData.data) {
          const data = resData.data;
          setSeller(data as any);
          setFormData({
            store_name: data.store_name || '',
            store_description: data.store_description || '',
            business_type: data.business_type || '',
            gst_number: data.gst_number || '',
            pan_number: data.pan_number || '',
          });
          setBankData({
            bank_account_number: data.bank_account_number || '',
            bank_ifsc: data.bank_ifsc || '',
            bank_account_name: data.bank_account_name || '',
          });
          setAddressData({
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            pincode: data.pincode || '',
          });
        }
      } catch (err) {
        setErrors({
          general: err instanceof Error ? err.message : 'Failed to load store settings',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [user]);

  const handleStoreChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !seller) return;

    try {
      setSavingStore(true);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.store;
        return newErrors;
      });
      setSuccessMessages((prev) => {
        const newMessages = { ...prev };
        delete newMessages.store;
        return newMessages;
      });

      const res = await fetch('/api/seller/store-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          store_name: formData.store_name,
          store_description: formData.store_description,
          business_type: formData.business_type,
          gst_number: formData.gst_number,
          pan_number: formData.pan_number
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update store settings');
      }

      setSuccessMessages((prev) => ({
        ...prev,
        store: 'Store information updated successfully!',
      }));

      setTimeout(() => {
        setSuccessMessages((prev) => {
          const newMessages = { ...prev };
          delete newMessages.store;
          return newMessages;
        });
      }, 3000);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        store: err instanceof Error ? err.message : 'Failed to update store information',
      }));
    } finally {
      setSavingStore(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !seller) return;

    try {
      setSavingBank(true);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.bank;
        return newErrors;
      });
      setSuccessMessages((prev) => {
        const newMessages = { ...prev };
        delete newMessages.bank;
        return newMessages;
      });

      const res = await fetch('/api/seller/store-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          bank_account_number: bankData.bank_account_number,
          bank_ifsc: bankData.bank_ifsc,
          bank_account_name: bankData.bank_account_name
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update bank details');
      }

      setSuccessMessages((prev) => ({
        ...prev,
        bank: 'Bank details updated successfully!',
      }));

      setTimeout(() => {
        setSuccessMessages((prev) => {
          const newMessages = { ...prev };
          delete newMessages.bank;
          return newMessages;
        });
      }, 3000);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        bank: err instanceof Error ? err.message : 'Failed to update bank details',
      }));
    } finally {
      setSavingBank(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !seller) return;

    try {
      setSavingAddress(true);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.address;
        return newErrors;
      });
      setSuccessMessages((prev) => {
        const newMessages = { ...prev };
        delete newMessages.address;
        return newMessages;
      });

      const res = await fetch('/api/seller/store-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          address: addressData.address,
          city: addressData.city,
          state: addressData.state,
          pincode: addressData.pincode
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update address');
      }

      setSuccessMessages((prev) => ({
        ...prev,
        address: 'Address updated successfully!',
      }));

      setTimeout(() => {
        setSuccessMessages((prev) => {
          const newMessages = { ...prev };
          delete newMessages.address;
          return newMessages;
        });
      }, 3000);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        address: err instanceof Error ? err.message : 'Failed to update address',
      }));
    } finally {
      setSavingAddress(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  const businessTypeOptions = [
    { value: 'sole_proprietor', label: 'Sole Proprietor' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'limited_company', label: 'Limited Company' },
    { value: 'llp', label: 'LLP' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-gray-500 mt-1">Manage your store information and business details</p>
      </div>

      {errors.general && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-red-800">{errors.general}</p>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Store Information</h2>
        <form onSubmit={handleSaveStore} className="space-y-4">
          <Input
            label="Store Name"
            name="store_name"
            value={formData.store_name}
            onChange={handleStoreChange}
            placeholder="Enter your store name"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Description
            </label>
            <Textarea
              name="store_description"
              value={formData.store_description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  store_description: e.target.value,
                }))
              }
              placeholder="Describe your store and what you sell"
              rows={4}
            />
          </div>

          <Select
            label="Business Type"
            name="business_type"
            value={formData.business_type}
            onChange={handleStoreChange}
            options={businessTypeOptions}
          />

          <Input
            label="GST Number"
            name="gst_number"
            value={formData.gst_number}
            onChange={handleStoreChange}
            placeholder="Enter your GST number"
          />

          <Input
            label="PAN Number"
            name="pan_number"
            value={formData.pan_number}
            onChange={handleStoreChange}
            placeholder="Enter your PAN number"
          />

          {errors.store && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{errors.store}</p>
            </div>
          )}

          {successMessages.store && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{successMessages.store}</p>
            </div>
          )}

          <Button variant="primary" type="submit" loading={savingStore}>
            Save Store Information
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Bank Details</h2>
        <form onSubmit={handleSaveBank} className="space-y-4">
          <Input
            label="Account Holder Name"
            name="bank_account_name"
            value={bankData.bank_account_name}
            onChange={handleBankChange}
            placeholder="Enter account holder name"
          />

          <Input
            label="Account Number"
            name="bank_account_number"
            value={bankData.bank_account_number}
            onChange={handleBankChange}
            placeholder="Enter account number"
          />

          <Input
            label="IFSC Code"
            name="bank_ifsc"
            value={bankData.bank_ifsc}
            onChange={handleBankChange}
            placeholder="Enter IFSC code"
          />

          {errors.bank && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{errors.bank}</p>
            </div>
          )}

          {successMessages.bank && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{successMessages.bank}</p>
            </div>
          )}

          <Button variant="primary" type="submit" loading={savingBank}>
            Save Bank Details
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Store Address</h2>
        <form onSubmit={handleSaveAddress} className="space-y-4">
          <Input
            label="Address"
            name="address"
            value={addressData.address}
            onChange={handleAddressChange}
            placeholder="Enter street address"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              name="city"
              value={addressData.city}
              onChange={handleAddressChange}
              placeholder="Enter city"
            />

            <Input
              label="State"
              name="state"
              value={addressData.state}
              onChange={handleAddressChange}
              placeholder="Enter state"
            />
          </div>

          <Input
            label="Pincode"
            name="pincode"
            value={addressData.pincode}
            onChange={handleAddressChange}
            placeholder="Enter pincode"
          />

          {errors.address && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{errors.address}</p>
            </div>
          )}

          {successMessages.address && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{successMessages.address}</p>
            </div>
          )}

          <Button variant="primary" type="submit" loading={savingAddress}>
            Save Address
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default function SafeStoreSettings() {
  return (
    <ErrorBoundary>
      <StoreSettings />
    </ErrorBoundary>
  );
}
