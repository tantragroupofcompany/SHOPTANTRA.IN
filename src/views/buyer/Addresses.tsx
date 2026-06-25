import { useEffect, useState } from 'react';
import { MapPin, Edit2, Trash2, Plus, Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Address } from '../../types';

const Addresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
  });

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
    'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal',
  ];

  useEffect(() => {
    if (!user?.id) return;
    fetchAddresses();
  }, [user?.id]);

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data as Address[]);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      if (editingId) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Insert new address
        const { error } = await supabase
          .from('addresses')
          .insert([
            {
              ...formData,
              user_id: user.id,
              country: 'India',
            },
          ]);

        if (error) throw error;
      }

      await fetchAddresses();
      resetForm();
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error saving address:', err);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAddresses();
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Remove default from all addresses
      const { error: updateError } = await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      // Set new default
      const { error: setError } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (setError) throw setError;
      await fetchAddresses();
    } catch (err) {
      console.error('Error setting default address:', err);
    }
  };

  const handleEditAddress = (address: Address) => {
    setFormData({
      label: address.label,
      full_name: address.full_name || '',
      phone: address.phone || '',
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    });
    setEditingId(address.id);
    setIsAddModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      label: '',
      full_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Saved Addresses</h1>
          <p className="text-gray-600 mt-2">Manage your delivery addresses</p>
        </div>
        <Button
          icon={<Plus className="w-5 h-5" />}
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
        >
          Add Address
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-48 animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <Card className="py-16 text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No addresses saved</h3>
          <p className="text-gray-600 mb-6">Add your first address to get started</p>
          <Button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
          >
            Add Address
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <Card key={address.id} className="relative">
              {address.is_default && (
                <Badge label="Default" variant="success" size="sm" />
              )}

              <h3 className="text-lg font-bold text-gray-900 mb-2 mt-3">
                {address.label}
              </h3>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p className="font-medium text-gray-900">{address.full_name}</p>
                <p>{address.phone}</p>
                <p>{address.address_line1}</p>
                {address.address_line2 && <p>{address.address_line2}</p>}
                <p>
                  {address.city}, {address.state} {address.pincode}
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Edit2 className="w-4 h-4" />}
                  onClick={() => handleEditAddress(address)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => handleDeleteAddress(address.id)}
                >
                  Delete
                </Button>
                {!address.is_default && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Check className="w-4 h-4" />}
                    onClick={() => handleSetDefault(address.id)}
                  >
                    Set Default
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Address Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title={editingId ? 'Edit Address' : 'Add New Address'}
        size="lg"
      >
        <form onSubmit={handleSaveAddress} className="space-y-6">
          <Input
            label="Address Label"
            placeholder="e.g., Home, Office"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            required
          />

          <Input
            label="Full Name"
            placeholder="Your full name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="+91 9876543210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />

          <Input
            label="Address Line 1"
            placeholder="House number, building name"
            value={formData.address_line1}
            onChange={(e) =>
              setFormData({ ...formData, address_line1: e.target.value })
            }
            required
          />

          <Input
            label="Address Line 2"
            placeholder="Apartment, suite (optional)"
            value={formData.address_line2}
            onChange={(e) =>
              setFormData({ ...formData, address_line2: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />

            <Select
              label="State"
              options={[
                { value: '', label: 'Select State' },
                ...indianStates.map((state) => ({ value: state, label: state })),
              ]}
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
            />
          </div>

          <Input
            label="Pincode"
            placeholder="6-digit pincode"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingId ? 'Update Address' : 'Add Address'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Addresses;
