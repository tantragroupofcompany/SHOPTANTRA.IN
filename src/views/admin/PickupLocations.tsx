import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, Shield, ShieldCheck, ShieldAlert, Store, User, Phone, MapPin, Edit3, X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PickupLocation {
  id: string;
  sellerId: string;
  storeName: string;
  contactName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  pickupLocationId?: string | null;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  seller?: {
    storeName: string;
    gstNumber?: string | null;
    user?: {
      fullName?: string | null;
      email: string;
    }
  }
}

export default function AdminPickupLocations() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLocationId, setEditLocationId] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pickup-locations');
      const result = await res.json();
      if (res.ok && result.success) {
        setLocations(result.data || []);
      }
    } catch (err) {
      console.error('Failed to load pickup locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (locationId: string, status: 'VERIFIED' | 'REJECTED', pickupLocId?: string) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/pickup-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddressId: locationId,
          verificationStatus: status,
          pickupLocationId: pickupLocId || undefined,
          adminUserId: user?.id
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        // Refresh local items
        setLocations(prev =>
          prev.map(loc =>
            loc.id === locationId
              ? { ...loc, verificationStatus: status, pickupLocationId: pickupLocId || loc.pickupLocationId }
              : loc
          )
        );
        setEditingId(null);
      } else {
        alert(result.error || 'Failed to update location status.');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveLocationId = (location: PickupLocation) => {
    handleUpdateStatus(location.id, 'VERIFIED', editLocationId);
  };

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = 
      loc.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.pincode.includes(searchQuery) ||
      (loc.pickupLocationId && loc.pickupLocationId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || loc.verificationStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'storeName',
      header: 'Warehouse & Contact',
      render: (row: PickupLocation) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-gray-900">
            <Store className="w-4 h-4 text-brand-orange" />
            {row.storeName}
          </div>
          <div className="text-xs text-gray-500 space-y-0.5">
            <p className="flex items-center gap-1 font-medium"><User className="w-3.5 h-3.5 text-gray-400" /> {row.contactName}</p>
            <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" /> {row.phone}</p>
            <p>{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'address',
      header: 'Location Address',
      render: (row: PickupLocation) => (
        <div className="space-y-1 max-w-[280px]">
          <p className="text-sm text-gray-800 font-medium leading-snug">{row.addressLine1}</p>
          {row.addressLine2 && <p className="text-xs text-gray-500">{row.addressLine2}</p>}
          <p className="text-xs font-semibold text-brand-navy flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-brand-orange shrink-0" />
            {row.city}, {row.state} - {row.pincode}
          </p>
          {(row.latitude || row.longitude) && (
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
              Lat: {row.latitude || 'N/A'}, Lng: {row.longitude || 'N/A'}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'gstNumber',
      header: 'GSTIN (Optional)',
      render: (row: PickupLocation) => (
        <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
          {row.seller?.gstNumber || 'N/A'}
        </span>
      )
    },
    {
      key: 'pickupLocationId',
      header: 'Master Location ID',
      render: (row: PickupLocation) => {
        const isEditing = editingId === row.id;
        return (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Input
                  value={editLocationId}
                  onChange={(e) => setEditLocationId(e.target.value)}
                  placeholder="e.g. WH-MUMB-01"
                  className="w-36 h-9 text-xs"
                />
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Check className="w-3.5 h-3.5" />}
                  onClick={() => handleSaveLocationId(row)}
                  disabled={updating}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<X className="w-3.5 h-3.5 text-red-500" />}
                  onClick={() => setEditingId(null)}
                />
              </>
            ) : (
              <>
                <span className="font-mono text-xs font-bold text-[#1B3A6B]">
                  {row.pickupLocationId || 'Not Assigned'}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Edit3 className="w-3.5 h-3.5 text-gray-400" />}
                  onClick={() => {
                    setEditingId(row.id);
                    setEditLocationId(row.pickupLocationId || '');
                  }}
                  title="Assign Location ID"
                />
              </>
            )}
          </div>
        );
      }
    },
    {
      key: 'verificationStatus',
      header: 'Status',
      render: (row: PickupLocation) => {
        const status = row.verificationStatus;
        const color = status === 'VERIFIED' ? 'success' : status === 'REJECTED' ? 'danger' : 'warning';
        const icon = status === 'VERIFIED' ? <ShieldCheck className="w-3.5 h-3.5" /> : 
                     status === 'REJECTED' ? <ShieldAlert className="w-3.5 h-3.5" /> : 
                     <Shield className="w-3.5 h-3.5" />;

        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
            color === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            color === 'danger' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {icon}
            {status}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: PickupLocation) => (
        <div className="flex gap-2">
          {row.verificationStatus !== 'VERIFIED' && (
            <Button
              size="sm"
              variant="outline"
              className="text-green-700 border-green-200 hover:bg-green-50 text-xs font-bold"
              onClick={() => handleUpdateStatus(row.id, 'VERIFIED')}
              disabled={updating}
            >
              Approve
            </Button>
          )}
          {row.verificationStatus !== 'REJECTED' && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-700 border-red-200 hover:bg-red-50 text-xs font-bold"
              onClick={() => handleUpdateStatus(row.id, 'REJECTED')}
              disabled={updating}
            >
              Reject
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-brand-navy border-l-4 border-brand-orange pl-3">
          Multi-Vendor Pickup Locations
        </h1>
        <p className="text-gray-500 mt-1">
          Manage, verify, and assign location IDs for seller pickup warehouses linked to the master shipping account.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Search warehouse, city, pin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                statusFilter === st
                  ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden border border-gray-150">
        <Table
          columns={columns}
          data={filteredLocations}
          loading={loading}
          keyExtractor={(row) => row.id}
          emptyMessage="No pickup locations found matching search filters."
        />
      </Card>
    </div>
  );
}
