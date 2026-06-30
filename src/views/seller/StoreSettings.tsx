import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { Seller } from '../../types';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { Upload, X, Store, RefreshCw } from 'lucide-react';

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
    pickup_store_name: '',
    pickup_contact_name: '',
    pickup_phone: '',
    pickup_email: '',
    address_line2: '',
    country: 'India',
    pickup_location_id: '',
    pickup_verification_status: 'PENDING',
    latitude: '',
    longitude: '',
  });
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessages, setSuccessMessages] = useState<Record<string, string>>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

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
          setLogoUrl(data.store_logo_url || null);
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
            pickup_store_name: data.pickup_store_name || '',
            pickup_contact_name: data.pickup_contact_name || '',
            pickup_phone: data.pickup_phone || '',
            pickup_email: data.pickup_email || '',
            address_line2: data.address_line2 || '',
            country: data.country || 'India',
            pickup_location_id: data.pickup_location_id || '',
            pickup_verification_status: data.pickup_verification_status || 'PENDING',
            latitude: data.latitude || '',
            longitude: data.longitude || '',
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setLogoError('Invalid file type. Please upload JPG, JPEG, PNG, or WEBP.');
      return;
    }

    // Validate size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setLogoError('File size must be less than 5 MB.');
      return;
    }

    setUploadingLogo(true);
    setLogoError(null);

    // Client-side crop and compress using HTML5 Canvas
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = 400; // 400x400 square crop is perfect
        canvas.height = 400;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw cropped to square center
          ctx.drawImage(
            img,
            (img.width - size) / 2,
            (img.height - size) / 2,
            size,
            size,
            0,
            0,
            400,
            400
          );

          // Convert canvas to Blob (JPEG with 0.85 quality compression)
          canvas.toBlob(async (blob) => {
            if (!blob) {
              setLogoError('Failed to compress image.');
              setUploadingLogo(false);
              return;
            }

            const uploadFile = new File([blob], file.name, { type: 'image/jpeg' });
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('userId', user.id);

            try {
              const res = await fetch('/api/seller/upload-logo', {
                method: 'POST',
                body: formData
              });

              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to upload logo.');
              }

              const resData = await res.json();
              setLogoUrl(resData.logoUrl);
              setSuccessMessages(prev => ({ ...prev, logo: 'Store logo updated successfully!' }));
              setTimeout(() => {
                setSuccessMessages(prev => {
                  const copy = { ...prev };
                  delete copy.logo;
                  return copy;
                });
              }, 3000);
            } catch (err: any) {
              setLogoError(err.message || 'Failed to upload logo.');
            } finally {
              setUploadingLogo(false);
            }
          }, 'image/jpeg', 0.85);
        }
      };
    };
  };

  const handleRemoveLogo = async () => {
    if (!user) return;
    setUploadingLogo(true);
    setLogoError(null);

    try {
      const res = await fetch('/api/seller/store-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          store_logo_url: null
        })
      });

      if (!res.ok) {
        throw new Error('Failed to remove store logo.');
      }

      setLogoUrl(null);
      setSuccessMessages(prev => ({ ...prev, logo: 'Store logo removed successfully!' }));
      setTimeout(() => {
        setSuccessMessages(prev => {
          const copy = { ...prev };
          delete copy.logo;
          return copy;
        });
      }, 3000);
    } catch (err: any) {
      setLogoError(err.message || 'Failed to remove logo.');
    } finally {
      setUploadingLogo(false);
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
          address_line2: addressData.address_line2,
          city: addressData.city,
          state: addressData.state,
          pincode: addressData.pincode,
          country: addressData.country,
          pickup_store_name: addressData.pickup_store_name,
          pickup_contact_name: addressData.pickup_contact_name,
          pickup_phone: addressData.pickup_phone,
          pickup_email: addressData.pickup_email,
          latitude: addressData.latitude,
          longitude: addressData.longitude,
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
        <h2 className="text-xl font-bold text-gray-900 mb-4">Store Brand Logo</h2>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Store Logo"
                loading="lazy"
                className="w-24 h-24 rounded-2xl object-cover border border-gray-200 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gray-100 flex flex-col items-center justify-center border border-dashed border-gray-300 text-gray-400">
                <Store size={32} />
                <span className="text-[10px] mt-1 font-semibold uppercase tracking-wider">No Logo</span>
              </div>
            )}
            {uploadingLogo && (
              <div className="absolute inset-0 bg-white/70 dark:bg-brand-navy-dark/70 rounded-2xl flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-brand-orange animate-spin" />
              </div>
            )}
          </div>
          
          <div className="space-y-2 flex-grow">
            <div className="flex flex-wrap gap-3">
              <label className={`cursor-pointer bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={16} />
                {logoUrl ? 'Change Logo' : 'Upload Logo'}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </label>
              
              {logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={uploadingLogo}
                  className="px-4 py-2 border border-red-200 text-red-650 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <X size={15} />
                  Remove
                </button>
              )}
            </div>
            
            <p className="text-xs text-gray-500">
              Accepted formats: JPG, JPEG, PNG, WEBP. Max size: 5 MB. Image is automatically cropped to a square and optimized.
            </p>

            {logoError && (
              <p className="text-red-500 text-xs font-semibold">{logoError}</p>
            )}
            
            {successMessages.logo && (
              <p className="text-green-600 text-xs font-semibold">{successMessages.logo}</p>
            )}
          </div>
        </div>
      </Card>

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-150">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Warehouse & Shipping Pickup Details</h2>
            <p className="text-xs text-gray-500 mt-0.5">Where our courier partner picks up your dispatches.中央集権化されたマスター発送アカウント用。</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              addressData.pickup_verification_status === 'VERIFIED'
                ? 'bg-green-50 text-green-700 border-green-200'
                : addressData.pickup_verification_status === 'REJECTED'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
            }`}>
              {addressData.pickup_verification_status === 'VERIFIED' ? '✓ Verified Location' :
               addressData.pickup_verification_status === 'REJECTED' ? '✕ Verification Rejected' :
               '⏳ Verification Pending'}
            </span>
            {addressData.pickup_location_id && (
              <span className="bg-brand-navy/10 text-brand-navy font-mono text-[10px] px-2 py-1 rounded-lg font-bold border border-brand-navy/10">
                ID: {addressData.pickup_location_id}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveAddress} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Warehouse / Store Name"
              name="pickup_store_name"
              value={addressData.pickup_store_name}
              onChange={handleAddressChange}
              placeholder="e.g. Surat Main Warehouse"
              required
            />
            <Input
              label="Contact Person Name"
              name="pickup_contact_name"
              value={addressData.pickup_contact_name}
              onChange={handleAddressChange}
              placeholder="e.g. Nilesh Gupta"
              required
            />
            <Input
              label="Mobile Number (Pickup Contact)"
              name="pickup_phone"
              value={addressData.pickup_phone}
              onChange={handleAddressChange}
              placeholder="e.g. 9099985145"
              required
            />
            <Input
              label="Warehouse Contact Email"
              name="pickup_email"
              value={addressData.pickup_email}
              onChange={handleAddressChange}
              placeholder="e.g. logistics@tantra.in"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Address Line 1"
              name="address"
              value={addressData.address}
              onChange={handleAddressChange}
              placeholder="Street Address, Building, Floor"
              required
            />
            <Input
              label="Address Line 2 (Optional)"
              name="address_line2"
              value={addressData.address_line2}
              onChange={handleAddressChange}
              placeholder="Landmark, Area Details"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="City"
              name="city"
              value={addressData.city}
              onChange={handleAddressChange}
              placeholder="e.g. Surat"
              required
            />
            <Input
              label="State"
              name="state"
              value={addressData.state}
              onChange={handleAddressChange}
              placeholder="e.g. Gujarat"
              required
            />
            <Input
              label="Country"
              name="country"
              value={addressData.country}
              onChange={handleAddressChange}
              placeholder="e.g. India"
              required
            />
            <Input
              label="Pincode"
              name="pincode"
              value={addressData.pincode}
              onChange={handleAddressChange}
              placeholder="e.g. 395002"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude (Optional)"
              name="latitude"
              value={addressData.latitude}
              onChange={handleAddressChange}
              placeholder="e.g. 21.1702"
            />
            <Input
              label="Longitude (Optional)"
              name="longitude"
              value={addressData.longitude}
              onChange={handleAddressChange}
              placeholder="e.g. 72.8311"
            />
          </div>

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

          <Button variant="primary" type="submit" loading={savingAddress} className="w-full md:w-auto font-bold px-6 py-2.5">
            Save Pickup Warehouse Address
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
