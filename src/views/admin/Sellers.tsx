import React, { useEffect, useState } from 'react';
import { Search, Eye, CheckCircle, XCircle, AlertCircle, ToggleLeft } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';

interface Seller {
  id: string;
  storeName: string;
  ownerEmail: string;
  category: string;
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  totalProducts: number;
  totalOrders: number;
  grossSales: number;
  commission: number;
  netEarnings: number;
  pendingEarnings: number;
  commissionRate: number;
  isVerified: boolean;
  verificationStatus: 'PENDING_VERIFICATION' | 'VERIFIED';
}

const Sellers = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [newCommission, setNewCommission] = useState(0);

  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    filterSellers();
  }, [sellers, searchTerm, statusFilter]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/sellers/analytics');
      const result = await res.json();
      if (result.success) {
        setSellers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSellers = () => {
    let filtered = [...sellers];

    if (searchTerm) {
      filtered = filtered.filter(
        (seller) =>
          seller.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          seller.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter((seller) => seller.status === statusFilter.toLowerCase());
    }

    setFilteredSellers(filtered);
  };

  const handleStatusChange = async (sellerId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/supabase-polyfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'sellers',
          action: 'update',
          filters: [{ column: 'id', operator: 'eq', value: sellerId }],
          updateData: { status: newStatus.toUpperCase() }
        })
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to update status');

      setSellers(sellers.map((s) => (s.id === sellerId ? { ...s, status: newStatus.toLowerCase() as any } : s)));
    } catch (error) {
      console.error('Error updating seller status:', error);
    }
  };

  const handleToggleVerification = async (sellerId: string, currentVerification: boolean) => {
    const nextStatus = currentVerification ? 'PENDING' : 'ACTIVE';
    try {
      const response = await fetch('/api/supabase-polyfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'sellers',
          action: 'update',
          filters: [{ column: 'id', operator: 'eq', value: sellerId }],
          updateData: { status: nextStatus }
        })
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to toggle verification');

      setSellers(sellers.map((s) => (s.id === sellerId ? { 
        ...s, 
        status: nextStatus.toLowerCase() as any, 
        isVerified: !currentVerification 
      } : s)));
    } catch (error) {
      console.error('Error updating verification status:', error);
    }
  };

  const handleUpdateCommission = async (sellerId: string) => {
    try {
      const response = await fetch('/api/supabase-polyfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'sellers',
          action: 'update',
          filters: [{ column: 'id', operator: 'eq', value: sellerId }],
          updateData: { commission_rate: newCommission }
        })
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to update commission');

      setSellers(sellers.map((s) => (s.id === sellerId ? { ...s, commissionRate: newCommission } : s)));
      setShowCommissionModal(false);
      setSelectedSeller(null);
    } catch (error) {
      console.error('Error updating commission rate:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading sellers list...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Seller Management</h1>
        <p className="text-gray-600 mt-2">Manage vendors and their store details</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <Input
              placeholder="Search by store name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All</option>
              <option>Active</option>
              <option>Pending</option>
              <option>Suspended</option>
              <option>Rejected</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Sellers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border-collapse text-left">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-500 font-bold">
                <th className="px-4 py-3">Store Name</th>
                <th className="px-4 py-3 text-center">Products</th>
                <th className="px-4 py-3 text-center">Orders</th>
                <th className="px-4 py-3 text-right">Gross Sales</th>
                <th className="px-4 py-3 text-right">Commission</th>
                <th className="px-4 py-3 text-right">Net Earnings</th>
                <th className="px-4 py-3 text-right">Pending Earnings</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Email Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSellers.map((seller) => (
                <tr key={seller.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <p className="font-bold text-gray-900">{seller.storeName}</p>
                    <p className="text-[11px] text-gray-500">{seller.ownerEmail}</p>
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-700">
                    {seller.totalProducts}
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-700">
                    {seller.totalOrders}
                  </td>
                  <td className="px-4 py-4 text-right font-extrabold text-gray-800">
                    ₹{seller.grossSales.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-brand-orange">
                    ₹{seller.commission.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-4 text-right font-extrabold text-blue-600">
                    ₹{seller.netEarnings.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-amber-600">
                    ₹{seller.pendingEarnings.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Badge className={getStatusColor(seller.status)}>
                      {seller.status.charAt(0).toUpperCase() + seller.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {seller.verificationStatus === 'VERIFIED' ? (
                      <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 border border-gray-200">
                        Pending OTP
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSeller(seller);
                          setShowDetailsModal(true);
                        }}
                        icon={<Eye className="w-4 h-4" />}
                      />
                      {seller.status === 'pending' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleStatusChange(seller.id, 'active')}
                            icon={<CheckCircle className="w-4 h-4" />}
                          />
                          <Button
                            variant="error"
                            size="sm"
                            onClick={() => handleStatusChange(seller.id, 'rejected')}
                            icon={<XCircle className="w-4 h-4" />}
                          />
                        </>
                      )}
                      {seller.status === 'active' && (
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleStatusChange(seller.id, 'suspended')}
                          icon={<AlertCircle className="w-4 h-4" />}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVerification(seller.id, seller.isVerified)}
                        icon={<ToggleLeft className="w-4 h-4" />}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSellers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No sellers found matching your criteria.</p>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600 border-t pt-4">
          Showing {filteredSellers.length} of {sellers.length} sellers
        </div>
      </Card>

      {/* Seller Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Seller Details"
      >
        {selectedSeller && (
          <div className="space-y-4 text-sm">
            <div className="border-b pb-4">
              <h3 className="text-lg font-bold text-gray-900">{selectedSeller.storeName}</h3>
              <p className="text-gray-600 mt-1">{selectedSeller.ownerEmail}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                <p className="text-gray-900 font-semibold mt-0.5">{selectedSeller.category}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                <p className="text-gray-900 font-semibold mt-0.5 capitalize">{selectedSeller.status}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Products Count</label>
                <p className="text-gray-900 font-semibold mt-0.5">{selectedSeller.totalProducts}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Orders Count</label>
                <p className="text-gray-900 font-semibold mt-0.5">{selectedSeller.totalOrders}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Gross Sales</label>
                <p className="text-gray-900 font-extrabold mt-0.5">₹{selectedSeller.grossSales.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Retention Commission</label>
                <p className="text-brand-orange font-extrabold mt-0.5">₹{selectedSeller.commission.toLocaleString('en-IN')} ({selectedSeller.commissionRate}%)</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Net Earnings</label>
                <p className="text-blue-600 font-extrabold mt-0.5">₹{selectedSeller.netEarnings.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Pending Earnings</label>
                <p className="text-amber-600 font-extrabold mt-0.5">₹{selectedSeller.pendingEarnings.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6 border-t pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setNewCommission(selectedSeller.commissionRate);
                  setShowCommissionModal(true);
                }}
              >
                Edit Commission
              </Button>
              <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Commission Modal */}
      <Modal
        isOpen={showCommissionModal}
        onClose={() => setShowCommissionModal(false)}
        title="Edit Commission Rate"
      >
        {selectedSeller && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={newCommission}
                onChange={(e) => setNewCommission(parseFloat(e.target.value))}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              Updating commission rate for <strong>{selectedSeller.storeName}</strong>
            </div>

            <div className="flex gap-3 mt-6 border-t pt-4">
              <Button variant="secondary" onClick={() => setShowCommissionModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateCommission(selectedSeller.id)}>
                Update Commission
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Sellers;
