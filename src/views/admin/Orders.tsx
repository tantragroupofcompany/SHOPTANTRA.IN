import React, { useState, useEffect } from 'react';
import { Eye, Filter, Calendar } from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';

interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  buyer_name: string;
  seller_id: string;
  seller_name: string;
  total_amount: number;
  item_count: number;
  payment_status: 'paid' | 'pending' | 'failed';
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState('');

  // Sample data
  const sampleOrders: Order[] = [
    {
      id: '1',
      order_number: 'ORD-001001',
      buyer_id: 'buyer1',
      buyer_name: 'John Doe',
      seller_id: 'seller1',
      seller_name: 'Tech Store',
      total_amount: 4599,
      item_count: 3,
      payment_status: 'paid',
      order_status: 'delivered',
      created_at: '2024-12-10',
    },
    {
      id: '2',
      order_number: 'ORD-001002',
      buyer_id: 'buyer2',
      buyer_name: 'Jane Smith',
      seller_id: 'seller2',
      seller_name: 'Fashion Hub',
      total_amount: 2299,
      item_count: 2,
      payment_status: 'paid',
      order_status: 'shipped',
      created_at: '2024-12-11',
    },
    {
      id: '3',
      order_number: 'ORD-001003',
      buyer_id: 'buyer3',
      buyer_name: 'Robert Johnson',
      seller_id: 'seller1',
      seller_name: 'Tech Store',
      total_amount: 5999,
      item_count: 1,
      payment_status: 'pending',
      order_status: 'processing',
      created_at: '2024-12-12',
    },
    {
      id: '4',
      order_number: 'ORD-001004',
      buyer_id: 'buyer4',
      buyer_name: 'Sarah Williams',
      seller_id: 'seller3',
      seller_name: 'Home Essentials',
      total_amount: 1899,
      item_count: 4,
      payment_status: 'paid',
      order_status: 'pending',
      created_at: '2024-12-13',
    },
    {
      id: '5',
      order_number: 'ORD-001005',
      buyer_id: 'buyer5',
      buyer_name: 'Michael Brown',
      seller_id: 'seller2',
      seller_name: 'Fashion Hub',
      total_amount: 3499,
      item_count: 2,
      payment_status: 'failed',
      order_status: 'cancelled',
      created_at: '2024-12-14',
    },
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // For now, use sample data
        // In production, fetch from Supabase:
        // const { data, error } = await supabase
        //   .from('orders')
        //   .select('*')
        //   .order('created_at', { ascending: false });
        setOrders(sampleOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.order_status !== statusFilter) return false;
    if (paymentFilter !== 'all' && order.payment_status !== paymentFilter) return false;
    if (dateRange && order.created_at !== dateRange) return false;
    return true;
  });

  const stats = {
    totalOrders: orders.length,
    pending: orders.filter(o => o.order_status === 'pending').length,
    processing: orders.filter(o => o.order_status === 'processing').length,
    delivered: orders.filter(o => o.order_status === 'delivered').length,
    cancelled: orders.filter(o => o.order_status === 'cancelled').length,
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    setUpdatingStatus(newStatus);
    try {
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, order_status: newStatus as any } : o));
      setSelectedOrder({ ...selectedOrder, order_status: newStatus as any });
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setUpdatingStatus('');
    }
  };

  const columns = [
    {
      key: 'order_number',
      header: 'Order #',
      className: 'font-medium text-gray-900',
    },
    {
      key: 'buyer_name',
      header: 'Buyer',
    },
    {
      key: 'seller_name',
      header: 'Seller',
    },
    {
      key: 'total_amount',
      header: 'Amount',
      render: (row: Order) => `$${row.total_amount.toLocaleString()}`,
    },
    {
      key: 'item_count',
      header: 'Items',
    },
    {
      key: 'payment_status',
      header: 'Payment',
      render: (row: Order) => (
        <Badge label={row.payment_status} variant={row.payment_status === 'paid' ? 'success' : row.payment_status === 'pending' ? 'warning' : 'danger'} size="sm" />
      ),
    },
    {
      key: 'order_status',
      header: 'Status',
      render: (row: Order) => (
        <Badge label={row.order_status} variant={row.order_status === 'delivered' ? 'success' : row.order_status === 'cancelled' ? 'danger' : 'info'} size="sm" />
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Order) => (
        <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />} onClick={() => handleViewDetails(row)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<Filter className="w-5 h-5 text-orange-500" />}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<Calendar className="w-5 h-5 text-orange-500" />}
        />
        <StatCard
          title="Processing"
          value={stats.processing}
          icon={<Filter className="w-5 h-5 text-orange-500" />}
        />
        <StatCard
          title="Delivered"
          value={stats.delivered}
          icon={<Filter className="w-5 h-5 text-orange-500" />}
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelled}
          icon={<Filter className="w-5 h-5 text-orange-500" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Order Status"
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'processing', label: 'Processing' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            label="Payment Status"
            options={[
              { value: 'all', label: 'All Payments' },
              { value: 'paid', label: 'Paid' },
              { value: 'pending', label: 'Pending' },
              { value: 'failed', label: 'Failed' },
            ]}
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          />
          <Input
            label="Filter by Date"
            type="date"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          />
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredOrders}
          loading={loading}
          keyExtractor={(order) => order.id}
          emptyMessage="No orders found"
        />
      </Card>

      {/* Order Details Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Order Details" size="lg">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Order Number</p>
                <p className="text-lg font-bold text-gray-900">{selectedOrder.order_number}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Order Date</p>
                <p className="text-lg font-bold text-gray-900">{selectedOrder.created_at}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Buyer</p>
                <p className="text-lg font-bold text-gray-900">{selectedOrder.buyer_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Seller</p>
                <p className="text-lg font-bold text-gray-900">{selectedOrder.seller_name}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">${selectedOrder.total_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Number of Items</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedOrder.item_count}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Payment Status</p>
                  <Badge label={selectedOrder.payment_status} variant={selectedOrder.payment_status === 'paid' ? 'success' : selectedOrder.payment_status === 'pending' ? 'warning' : 'danger'} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Order Status</p>
                  <Badge label={selectedOrder.order_status} variant={selectedOrder.order_status === 'delivered' ? 'success' : selectedOrder.order_status === 'cancelled' ? 'danger' : 'info'} />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-2">Admin Direct Order Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={selectedOrder.payment_status === 'paid' ? 'outline' : 'primary'} 
                  size="sm"
                  onClick={() => {
                    setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, payment_status: 'paid' } : o));
                    setSelectedOrder({ ...selectedOrder, payment_status: 'paid' });
                    alert('Payment manually verified successfully! Invoice generated.');
                  }}
                  disabled={selectedOrder.payment_status === 'paid'}
                >
                  Verify Payment & Invoice
                </Button>
                <Button 
                  variant={selectedOrder.order_status === 'processing' ? 'outline' : 'primary'} 
                  size="sm"
                  onClick={() => {
                    setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, order_status: 'processing' } : o));
                    setSelectedOrder({ ...selectedOrder, order_status: 'processing' });
                    alert('Order confirmed and moved to Processing. Customer notified: "Your Order Has Been Confirmed".');
                  }}
                  disabled={selectedOrder.order_status === 'processing'}
                >
                  Confirm & Start Processing
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const newSeller = prompt("Enter new Seller Name:", selectedOrder.seller_name);
                    if (newSeller) {
                      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, seller_name: newSeller } : o));
                      setSelectedOrder({ ...selectedOrder, seller_name: newSeller });
                    }
                  }}
                >
                  Assign Seller
                </Button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Logistics Cycle Update</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'].map(status => (
                  <Button
                    key={status}
                    variant={selectedOrder.order_status === status ? 'primary' : 'outline'}
                    size="xs"
                    onClick={() => handleUpdateStatus(status)}
                    disabled={updatingStatus === status}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
