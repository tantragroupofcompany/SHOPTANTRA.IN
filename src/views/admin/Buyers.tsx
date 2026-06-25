import React, { useState, useEffect } from 'react';
import { Eye, Search, Filter } from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';

interface Buyer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  status: 'active' | 'inactive';
  joined_date: string;
}

interface BuyerDetail extends Buyer {
  addresses: Array<{ id: string; address: string; city: string; zipcode: string }>;
  orderHistory: Array<{ id: string; order_number: string; date: string; amount: number; status: string }>;
  supportTickets: Array<{ id: string; subject: string; status: string; created_at: string }>;
}

const Buyers = () => {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sample data
  const sampleBuyers: Buyer[] = [
    {
      id: '1',
      full_name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0101',
      total_orders: 12,
      total_spent: 4599,
      status: 'active',
      joined_date: '2023-05-15',
    },
    {
      id: '2',
      full_name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1-555-0102',
      total_orders: 8,
      total_spent: 2899,
      status: 'active',
      joined_date: '2023-08-20',
    },
    {
      id: '3',
      full_name: 'Robert Johnson',
      email: 'robert.j@example.com',
      phone: '+1-555-0103',
      total_orders: 5,
      total_spent: 1799,
      status: 'inactive',
      joined_date: '2023-02-10',
    },
    {
      id: '4',
      full_name: 'Sarah Williams',
      email: 'sarah.w@example.com',
      phone: '+1-555-0104',
      total_orders: 15,
      total_spent: 6299,
      status: 'active',
      joined_date: '2023-01-05',
    },
    {
      id: '5',
      full_name: 'Michael Brown',
      email: 'michael.b@example.com',
      phone: '+1-555-0105',
      total_orders: 3,
      total_spent: 899,
      status: 'active',
      joined_date: '2024-03-12',
    },
  ];

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        setLoading(true);
        // For now, use sample data
        // In production, fetch from Supabase:
        // const { data, error } = await supabase
        //   .from('profiles')
        //   .select('*')
        //   .eq('role', 'buyer')
        //   .order('created_at', { ascending: false });
        setBuyers(sampleBuyers);
      } catch (error) {
        console.error('Error fetching buyers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuyers();
  }, []);

  const filteredBuyers = buyers.filter(buyer => {
    if (statusFilter !== 'all' && buyer.status !== statusFilter) return false;
    if (searchQuery && !buyer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) && !buyer.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    totalBuyers: buyers.length,
    activeBuyers: buyers.filter(b => b.status === 'active').length,
    inactiveBuyers: buyers.filter(b => b.status === 'inactive').length,
    totalRevenue: buyers.reduce((sum, b) => sum + b.total_spent, 0),
  };

  const handleViewBuyer = (buyer: Buyer) => {
    const detail: BuyerDetail = {
      ...buyer,
      addresses: [
        { id: '1', address: '123 Main St', city: 'New York', zipcode: '10001' },
        { id: '2', address: '456 Oak Ave', city: 'New York', zipcode: '10002' },
      ],
      orderHistory: [
        { id: '1', order_number: 'ORD-001001', date: '2024-12-10', amount: 599, status: 'delivered' },
        { id: '2', order_number: 'ORD-001002', date: '2024-12-05', amount: 799, status: 'delivered' },
        { id: '3', order_number: 'ORD-001003', date: '2024-11-28', amount: 1299, status: 'delivered' },
      ],
      supportTickets: [
        { id: '1', subject: 'Delivery Issue', status: 'resolved', created_at: '2024-12-08' },
        { id: '2', subject: 'Product Quality', status: 'resolved', created_at: '2024-11-25' },
      ],
    };
    setSelectedBuyer(detail);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (buyerId: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      setBuyers(buyers.map(b => b.id === buyerId ? { ...b, status: newStatus } : b));
      if (selectedBuyer && selectedBuyer.id === buyerId) {
        setSelectedBuyer({ ...selectedBuyer, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating buyer:', error);
    }
  };

  const columns = [
    {
      key: 'full_name',
      header: 'Name',
      className: 'font-medium text-gray-900',
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'phone',
      header: 'Phone',
    },
    {
      key: 'total_orders',
      header: 'Orders',
    },
    {
      key: 'total_spent',
      header: 'Total Spent',
      render: (row: Buyer) => `$${row.total_spent.toLocaleString()}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Buyer) => (
        <Badge label={row.status} variant={row.status === 'active' ? 'success' : 'danger'} size="sm" />
      ),
    },
    {
      key: 'joined_date',
      header: 'Joined',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Buyer) => (
        <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />} onClick={() => handleViewBuyer(row)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Buyers Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Buyers"
          value={stats.totalBuyers}
          icon={<Filter className="w-5 h-5 text-orange-500" />}
        />
        <StatCard
          title="Active Buyers"
          value={stats.activeBuyers}
          icon={<Filter className="w-5 h-5 text-orange-500" />}
        />
        <StatCard
          title="Inactive Buyers"
          value={stats.inactiveBuyers}
          icon={<Filter className="w-5 h-5 text-orange-500" />}
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={<Filter className="w-5 h-5 text-orange-500" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Search"
            placeholder="Search by name or email"
            icon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            label="Status Filter"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Buyers Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredBuyers}
          loading={loading}
          keyExtractor={(buyer) => buyer.id}
          emptyMessage="No buyers found"
        />
      </Card>

      {/* Buyer Details Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buyer Details" size="xl">
        {selectedBuyer && (
          <div className="space-y-6">
            {/* Profile Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Profile Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Full Name</p>
                  <p className="text-gray-900 font-medium">{selectedBuyer.full_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                  <p className="text-gray-900 font-medium">{selectedBuyer.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Phone</p>
                  <p className="text-gray-900 font-medium">{selectedBuyer.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Joined Date</p>
                  <p className="text-gray-900 font-medium">{selectedBuyer.joined_date}</p>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Addresses</h3>
              <div className="space-y-3">
                {selectedBuyer.addresses.map(addr => (
                  <div key={addr.id} className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium text-gray-900">{addr.address}</p>
                    <p className="text-sm text-gray-600">{addr.city}, {addr.zipcode}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order History */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Order History</h3>
              <div className="space-y-3">
                {selectedBuyer.orderHistory.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{order.order_number}</p>
                      <p className="text-xs text-gray-500">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${order.amount.toLocaleString()}</p>
                      <Badge label={order.status} variant="success" size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Tickets */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Support Tickets</h3>
              <div className="space-y-3">
                {selectedBuyer.supportTickets.map(ticket => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{ticket.subject}</p>
                      <p className="text-xs text-gray-500">{ticket.created_at}</p>
                    </div>
                    <Badge label={ticket.status} variant={ticket.status === 'resolved' ? 'success' : 'warning'} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Status Management */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Account Status</h3>
              <div className="flex items-center gap-4">
                <Badge label={selectedBuyer.status} variant={selectedBuyer.status === 'active' ? 'success' : 'danger'} />
                <Button
                  variant={selectedBuyer.status === 'active' ? 'danger' : 'success'}
                  size="sm"
                  onClick={() => handleToggleStatus(selectedBuyer.id, selectedBuyer.status)}
                >
                  {selectedBuyer.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Buyers;
