import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Download, RotateCcw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem } from '../../types';

const OrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchOrders();
  }, [user?.id, statusFilter]);

  const fetchOrders = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data as Order[]);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = (order: Order) => {
    const invoiceContent = `
      SHOPTANTRA INVOICE
      Order #${order.order_number}

      Order Date: ${new Date(order.created_at).toLocaleDateString()}
      Status: ${order.status.toUpperCase()}

      Items:
      ${order.order_items
        ?.map((item: OrderItem) => `- ${item.title} x${item.quantity}: ₹${item.total}`)
        .join('\n')}

      Subtotal: ₹${order.subtotal.toFixed(2)}
      Shipping: ₹${order.shipping_amount.toFixed(2)}
      Tax: ₹${order.tax_amount.toFixed(2)}
      Discount: -₹${order.discount_amount.toFixed(2)}

      TOTAL: ₹${order.total_amount.toFixed(2)}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(invoiceContent));
    element.setAttribute('download', `invoice-${order.order_number}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const columns = [
    {
      key: 'order_number',
      header: 'Order #',
      render: (row: Order) => (
        <button
          onClick={() => {
            if (expandedId === row.id) {
              setExpandedId(null);
              setSelectedOrder(null);
            } else {
              setExpandedId(row.id);
              setSelectedOrder(row);
            }
          }}
          className="font-medium text-[#1B3A6B] hover:text-orange-500 flex items-center gap-2"
        >
          #{row.order_number}
          <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === row.id ? 'rotate-180' : ''}`} />
        </button>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (row: Order) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: 'total_amount',
      header: 'Amount',
      render: (row: Order) => (
        <span className="font-semibold text-gray-900">₹{row.total_amount.toFixed(2)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Order) => {
        const badge = statusBadge(row.status);
        return <Badge label={badge.label} variant={badge.variant} size="sm" />;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Order) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={<Download className="w-4 h-4" />}
            onClick={() => downloadInvoice(row)}
          />
          <Button
            size="sm"
            variant="ghost"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={() => console.log('Reorder:', row.id)}
          />
        </div>
      ),
    },
  ];

  const statusOptions = ['all', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
        <p className="text-gray-600 mt-2">View and manage all your orders</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          data={orders}
          loading={loading}
          keyExtractor={(row) => row.id}
          emptyMessage="No orders found"
        />
      </Card>

      {/* Expandable Order Details */}
      {expandedId && selectedOrder && (
        <Card className="border-l-4 border-orange-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-4">
            <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
            
            <div className="flex items-center gap-2.5 bg-orange-50/50 dark:bg-brand-navy-light/10 px-3 py-1.5 rounded-xl border border-brand-orange/10">
              {selectedOrder.seller_logo_url ? (
                <img
                  src={selectedOrder.seller_logo_url}
                  alt="Seller Logo"
                  loading="lazy"
                  className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center border border-dashed border-brand-orange/20 text-brand-orange text-xs font-bold">
                  🏪
                </div>
              )}
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-none">Sold By</p>
                <Link
                  to={`/store/${selectedOrder.seller_id}`}
                  className="font-bold text-gray-800 dark:text-gray-200 hover:text-brand-orange hover:underline text-xs"
                >
                  {selectedOrder.seller_name || 'Tantra Store'}
                </Link>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Order Number</p>
                <p className="text-lg font-bold text-gray-900">#{selectedOrder.order_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                <p className="text-lg font-bold">{selectedOrder.status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Payment Status</p>
                <p className="text-lg font-bold">{selectedOrder.payment_status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Total</p>
                <p className="text-lg font-bold text-[#1B3A6B]">₹{selectedOrder.total_amount.toFixed(2)}</p>
              </div>
            </div>

            {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item: OrderItem) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900">₹{item.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedOrder.shipping_address && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Shipping Address</h4>
                <p className="text-gray-600 text-sm">
                  {typeof selectedOrder.shipping_address === 'object'
                    ? Object.values(selectedOrder.shipping_address).join(', ')
                    : selectedOrder.shipping_address}
                </p>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">₹{selectedOrder.shipping_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">₹{selectedOrder.tax_amount.toFixed(2)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-green-600">-₹{selectedOrder.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total</span>
                  <span className="text-[#1B3A6B]">₹{selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default OrderHistory;
