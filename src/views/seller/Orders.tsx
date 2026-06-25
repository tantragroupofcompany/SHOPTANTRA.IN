import { useState, useEffect } from 'react';
import { Eye, ChevronRight, Package } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderItem } from '../../types';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

interface OrderWithItems extends Order {
  order_items?: OrderItem[];
}

type OrderStatusFilter = 'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<Order['status']>('pending');
  const [shipmentTrackingNo, setShipmentTrackingNo] = useState<Record<string, string>>({});
  const [shipmentDispatchDate, setShipmentDispatchDate] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/seller/orders?userId=${user.id}`);
        if (!res.ok) throw new Error('Failed to load orders from API');
        const resData = await res.json();

        if (resData.success && resData.data) {
          const formatted = resData.data.map((o: any) => ({
            ...o,
            status: o.status.toLowerCase(),
            paymentStatus: o.payment_status.toLowerCase(),
            paymentMethod: o.payment_method,
            orderNumber: o.order_number,
            buyerName: o.buyer_name,
            buyerEmail: o.buyer_email,
            buyerPhone: o.buyer_phone,
            totalAmount: o.total_amount,
            discountAmount: o.discount_amount,
            shippingAmount: o.shipping_amount,
            taxAmount: o.tax_amount,
            order_items: o.order_items,
            shipments: o.shipments || [],
            created_at: o.created_at
          }));
          setOrders(formatted as any[]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  const handleOpenModal = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedOrder(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || newStatus === selectedOrder.status) {
      handleCloseModal();
      return;
    }

    try {
      setUpdatingStatus(true);

      const res = await fetch('/api/seller/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedOrder.id, status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update status');

      setOrders((prev) =>
        prev.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, status: newStatus }
            : order
        )
      );

      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!selectedOrder) return;
    try {
      setUpdatingStatus(true);
      const res = await fetch('/api/seller/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedOrder.id, status: 'confirmed' })
      });

      if (!res.ok) throw new Error('Failed to accept order');

      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'confirmed' } : o));
      setSelectedOrder({ ...selectedOrder, status: 'confirmed' });
      setNewStatus('confirmed');
      alert('Order accepted successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to accept order: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;
    try {
      setUpdatingStatus(true);
      const res = await fetch('/api/seller/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedOrder.id, status: 'cancelled' })
      });

      if (!res.ok) throw new Error('Failed to reject order');

      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'cancelled' } : o));
      setSelectedOrder({ ...selectedOrder, status: 'cancelled' });
      setNewStatus('cancelled');
      alert('Order rejected successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to reject order: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleGenerateShippingLabel = async () => {
    if (!selectedOrder) return;
    try {
      setUpdatingStatus(true);
      const res = await fetch('/api/shipment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder.id }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert('Shipment successfully created in database! Assigned to India Post Speed Post.');
        window.location.reload();
      } else {
        alert('Failed to generate shipping label: ' + (result.error || 'Server error'));
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate shipping label: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateShipmentStatus = async (shipmentId: string, status: string, trackingNumber?: string, dispatchDate?: string) => {
    try {
      setUpdatingStatus(true);
      const res = await fetch('/api/shipment/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId,
          status,
          trackingNumber,
          dispatchDate
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert(`Shipment status updated to ${status} successfully!`);
        window.location.reload();
      } else {
        alert('Failed to update status: ' + result.error);
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred during shipment status update.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!selectedOrder) return;
    
    const invoiceContent = `
╔═══════════════════════════════════════════════════╗
║                   SHOPTANTRA                      ║
║          Multi-Vendor E-Commerce Platform         ║
╚═══════════════════════════════════════════════════╝

INVOICE DETAILS
═══════════════════════════════════════════════════

Invoice Number:    ${selectedOrder.order_number}
Invoice Date:      ${new Date(selectedOrder.created_at).toLocaleDateString()}
Status:            ${selectedOrder.status.toUpperCase()}
Payment Status:    ${selectedOrder.payment_status.toUpperCase()}

CUSTOMER INFORMATION
═══════════════════════════════════════════════════

Name:              ${getCustomerInfo(selectedOrder)}

ITEMS
═══════════════════════════════════════════════════

${selectedOrder.order_items?.map((item) => `
Product:           ${item.title}
Quantity:          ${item.quantity}
Unit Price:        ₹${item.price.toFixed(2)}
Total:             ₹${item.total.toFixed(2)}
`).join('\n─────────────────────────────────────────────────────\n') || 'No items'}

BILLING SUMMARY
═══════════════════════════════════════════════════

Subtotal:          ₹${selectedOrder.subtotal.toFixed(2)}
Discount:          -₹${selectedOrder.discount_amount.toFixed(2)}
Shipping:          ₹${selectedOrder.shipping_amount.toFixed(2)}
Tax (GST):         ₹${selectedOrder.tax_amount.toFixed(2)}
─────────────────────────────────────────────────────
TOTAL AMOUNT:      ₹${selectedOrder.total_amount.toFixed(2)}

PAYMENT METHOD
═══════════════════════════════════════════════════

Method:            ${selectedOrder.payment_method || 'Not specified'}
Status:            ${selectedOrder.payment_status.toUpperCase()}

SHIPPING ADDRESS
═══════════════════════════════════════════════════

${selectedOrder.shipping_address ? Object.entries(selectedOrder.shipping_address).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`).join('\n') : 'Address not provided'}

═══════════════════════════════════════════════════

Thank you for your purchase!
For support, visit: www.shoptantra.com/support

Generated on: ${new Date().toLocaleString()}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(invoiceContent));
    element.setAttribute('download', `invoice-${selectedOrder.order_number}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleBulkPrintLabels = () => {
    if (selectedOrderIds.length === 0) {
      alert('Please select at least one order.');
      return;
    }
    const shipmentIds: string[] = [];
    orders.forEach(order => {
      if (selectedOrderIds.includes(order.id) && (order as any).shipments) {
        (order as any).shipments.forEach((s: any) => {
          if (s.id) shipmentIds.push(s.id);
        });
      }
    });

    if (shipmentIds.length === 0) {
      alert('None of the selected orders have active shipments generated yet. Please split/create shipments first.');
      return;
    }

    window.open(`/api/shipment/label?ids=${shipmentIds.join(',')}`, '_blank');
  };

  const handleBulkExportCSV = () => {
    if (selectedOrderIds.length === 0) {
      alert('Please select at least one order to export.');
      return;
    }

    const exported = orders.filter(o => selectedOrderIds.includes(o.id));
    const csvRows = [
      ['Order Number', 'Date', 'Customer', 'Items Count', 'Total Amount', 'Status', 'Payment Status', 'Tracking Number'],
    ];

    exported.forEach(order => {
      csvRows.push([
        order.order_number,
        new Date(order.created_at).toLocaleDateString('en-IN'),
        getCustomerInfo(order),
        String(order.order_items?.length || 0),
        String(order.total_amount),
        order.status,
        order.payment_status,
        order.tracking_number || '',
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + csvRows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shoptantra-orders-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkCreateShipments = async () => {
    if (selectedOrderIds.length === 0) {
      alert('Please select at least one order.');
      return;
    }

    setUpdatingStatus(true);
    let successCount = 0;

    for (const orderId of selectedOrderIds) {
      try {
        const res = await fetch('/api/shipment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        const result = await res.json();
        if (res.ok && result.success) {
          successCount++;
        }
      } catch (e) {
        console.error(e);
      }
    }

    setUpdatingStatus(false);
    alert(`Successfully processed shipments for ${successCount} order(s).`);
    window.location.reload();
  };

  const getCustomerInfo = (order: OrderWithItems) => {
    if (order.shipping_address && typeof order.shipping_address === 'object') {
      const addr = order.shipping_address as Record<string, unknown>;
      return addr.full_name || addr.name || 'Customer';
    }
    return 'Customer';
  };

  const statusOptions: { value: Order['status']; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-1">Manage and track customer orders</p>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-gray-100 pb-4 overflow-x-auto">
            {(['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
              </button>
            ))}
          </div>

          {/* Bulk Operations Panel */}
          {selectedOrderIds.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-gray-800">
                {selectedOrderIds.length} Order(s) Selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleBulkCreateShipments}
                  loading={updatingStatus}
                >
                  Bulk Create Shipments
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkPrintLabels}
                >
                  Bulk Print Labels
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkExportCSV}
                >
                  Bulk Export CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedOrderIds([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {filteredOrders.length === 0 && !loading ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">
                {statusFilter !== 'all'
                  ? `No ${statusFilter} orders`
                  : 'No orders yet'}
              </p>
            </div>
          ) : (
            <Table<OrderWithItems>
              columns={[
                {
                  key: 'select',
                  header: '',
                  render: (order) => (
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrderIds((prev) => [...prev, order.id]);
                        } else {
                          setSelectedOrderIds((prev) => prev.filter((id) => id !== order.id));
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer w-4 h-4"
                    />
                  ),
                },
                {
                  key: 'order_number',
                  header: 'Order #',
                  render: (order) => (
                    <span className="font-medium text-gray-900">
                      {order.order_number}
                    </span>
                  ),
                },
                {
                  key: 'created_at',
                  header: 'Date',
                  render: (order) => (
                    <span className="text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </span>
                  ),
                },
                {
                  key: 'buyer_id',
                  header: 'Customer',
                  render: (order) => (
                    <span className="text-gray-700">
                      {getCustomerInfo(order)}
                    </span>
                  ),
                },
                {
                  key: 'order_items',
                  header: 'Items',
                  render: (order) => (
                    <span className="text-gray-700">
                      {order.order_items?.length || 0} item(s)
                    </span>
                  ),
                },
                {
                  key: 'total_amount',
                  header: 'Total',
                  render: (order) => (
                    <span className="font-medium text-gray-900">
                      ₹{order.total_amount.toFixed(2)}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (order) => {
                    const badge = statusBadge(order.status);
                    return <Badge label={badge.label} variant={badge.variant} />;
                  },
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  className: 'text-right',
                  render: (order) => (
                    <button
                      onClick={() => handleOpenModal(order)}
                      className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ),
                },
              ]}
              data={filteredOrders}
              loading={loading}
              keyExtractor={(order) => order.id}
              emptyMessage="No orders found"
            />
          )}
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-150 text-xs">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Order ID</p>
                <p className="text-sm font-semibold text-gray-900">{selectedOrder.order_number}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Order Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Order Status</p>
                <p className="text-sm font-semibold text-gray-900 text-orange-600 uppercase">{selectedOrder.status}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Customer Name</p>
                <p className="text-sm font-semibold text-gray-900">{getCustomerInfo(selectedOrder)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Customer Mobile</p>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedOrder.buyer_phone || (selectedOrder.shipping_address as any)?.phone || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Customer Email</p>
                <p className="text-sm font-semibold text-gray-900">{selectedOrder.buyer_email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Payment Method</p>
                <p className="text-sm font-semibold text-gray-900">{selectedOrder.payment_method || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Payment Status</p>
                <p className="text-sm font-semibold text-gray-900 uppercase">{selectedOrder.payment_status}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Pincode</p>
                <p className="text-sm font-semibold text-gray-900">{(selectedOrder.shipping_address as any)?.pincode || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Full Delivery Address</p>
                <p className="text-sm font-semibold text-gray-900">
                  {(selectedOrder.shipping_address as any)?.address || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">City & State</p>
                <p className="text-sm font-semibold text-gray-900">
                  {(selectedOrder.shipping_address as any)?.city || 'N/A'}, {(selectedOrder.shipping_address as any)?.state || 'N/A'}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-3">
                {selectedOrder.order_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between pb-3 border-b border-gray-100 last:border-0 text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">
                        SKU: <span className="font-semibold text-gray-700">{item.sku || 'N/A'}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        ₹{item.price.toFixed(2)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ₹{item.total.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  ₹{selectedOrder.subtotal.toFixed(2)}
                </span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-green-600">
                    -₹{selectedOrder.discount_amount.toFixed(2)}
                  </span>
                </div>
              )}
              {selectedOrder.shipping_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">
                    ₹{selectedOrder.shipping_amount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-orange-600">
                  ₹{selectedOrder.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            {selectedOrder.status !== 'pending' && selectedOrder.status !== 'cancelled' && (
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={16} className="text-orange-500" />
                  India Post Speed Post — Shipment Management
                </h3>
                
                {(!selectedOrder.shipments || selectedOrder.shipments.length === 0) ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl space-y-2">
                    <p className="text-xs text-yellow-800">
                      No automated shipping orders created yet. Click the button below to generate split shipments.
                    </p>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={async () => {
                        try {
                          setUpdatingStatus(true);
                          const res = await fetch('/api/shipment/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: selectedOrder.id }),
                          });
                          const result = await res.json();
                          if (res.ok && result.success) {
                            alert('Split shipments created successfully!');
                            window.location.reload();
                          } else {
                            alert('Failed to split order: ' + result.error);
                          }
                        } catch (e) {
                          alert('Error occurred while splitting order.');
                        } finally {
                          setUpdatingStatus(false);
                        }
                      }}
                      loading={updatingStatus}
                    >
                      Process Split Shipments
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedOrder.shipments.map((ship: any, sIdx: number) => (
                      <div key={ship.id || sIdx} className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-gray-400 block">SHIPMENT {sIdx + 1}</span>
                            <span className="font-bold text-gray-800">{ship.shipment_number || ship.shipmentNumber}</span>
                          </div>
                          <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-extrabold uppercase text-[10px]">
                            {ship.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                          <div><strong>AWB / Tracking:</strong> {ship.tracking_number || ship.awb_number || 'Pending'}</div>
                          <div><strong>Courier:</strong> {ship.courier_partner?.name || ship.courierPartner?.name || 'India Post Speed Post'}</div>
                          <div><strong>Weight:</strong> {ship.weight || 0.5} kg</div>
                          <div><strong>COD Collect:</strong> ₹{ship.cod_amount || ship.codAmount || 0}</div>
                          {ship.dispatch_date && <div><strong>Dispatch Date:</strong> {ship.dispatch_date}</div>}
                        </div>

                        {/* Speed Post manual entry form */}
                        {ship.status !== 'delivered' && ship.status !== 'cancelled' && (
                          <div className="border-t border-gray-200/60 pt-3 space-y-2">
                            <p className="text-[10px] font-bold text-gray-700 uppercase">India Post Speed Post Dispatch Info</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">Tracking Number</label>
                                <input
                                  type="text"
                                  placeholder="e.g. SP123456789IN"
                                  className="w-full text-xs border border-gray-300 rounded p-1 bg-white"
                                  value={shipmentTrackingNo[ship.id] || ship.tracking_number || ''}
                                  onChange={(e) => setShipmentTrackingNo({...shipmentTrackingNo, [ship.id]: e.target.value})}
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">Dispatch Date</label>
                                <input
                                  type="date"
                                  className="w-full text-xs border border-gray-300 rounded p-1 bg-white"
                                  value={shipmentDispatchDate[ship.id] || ship.dispatch_date || ''}
                                  onChange={(e) => setShipmentDispatchDate({...shipmentDispatchDate, [ship.id]: e.target.value})}
                                />
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                onClick={() => handleUpdateShipmentStatus(ship.id, 'PACKED')}
                                className="bg-gray-800 hover:bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded transition-colors"
                              >
                                Mark Packed
                              </button>
                              <button
                                onClick={() => {
                                  const trk = shipmentTrackingNo[ship.id] || ship.tracking_number;
                                  const dsp = shipmentDispatchDate[ship.id] || ship.dispatch_date;
                                  if (!trk || !dsp) {
                                    alert('Please enter India Post Tracking Number and Dispatch Date first.');
                                    return;
                                  }
                                  handleUpdateShipmentStatus(ship.id, 'SHIPPED', trk, dsp);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1 rounded transition-colors"
                              >
                                Mark Shipped & Set Tracking
                              </button>
                              <button
                                onClick={() => handleUpdateShipmentStatus(ship.id, 'DELIVERED')}
                                className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-2.5 py-1 rounded transition-colors"
                              >
                                Mark Delivered
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-2 border-t border-gray-200/60">
                          <a
                            href={`/api/shipment/label?ids=${ship.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded transition-colors inline-block text-center decoration-none"
                          >
                            Print Label
                          </a>
                          <a
                            href={`/api/shipment/label?ids=${ship.id}&download=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white hover:bg-gray-150 border border-gray-200 text-gray-700 text-[10px] font-bold px-3 py-1.5 rounded transition-colors inline-block text-center decoration-none"
                          >
                            Download PDF
                          </a>
                          <button
                            onClick={() => {
                              alert(`Downloading tax invoice for Shipment ${ship.shipment_number || ship.shipmentNumber}`);
                              handleDownloadInvoice();
                            }}
                            className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-bold px-3 py-1.5 rounded transition-colors"
                          >
                            Get Tax Invoice
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions Section */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Actions</h4>
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status === 'pending' && (
                  <>
                    <Button
                      variant="primary"
                      className="bg-green-600 hover:bg-green-700 text-white border-none"
                      onClick={handleAcceptOrder}
                      loading={updatingStatus}
                    >
                      Accept Order
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={handleRejectOrder}
                      loading={updatingStatus}
                    >
                      Reject Order
                    </Button>
                  </>
                )}
                {selectedOrder.status !== 'pending' && selectedOrder.status !== 'cancelled' && (
                  <>
                    {!selectedOrder.tracking_number && (
                      <Button
                        variant="primary"
                        onClick={handleGenerateShippingLabel}
                        loading={updatingStatus}
                      >
                        Generate Shipping Label
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleDownloadInvoice}
                    >
                      Download Invoice
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <Select
                options={statusOptions}
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as Order['status'])}
              />
            </div>

            {selectedOrder.tracking_number && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Tracking Number</p>
                <p className="text-lg font-semibold text-blue-600">
                  {selectedOrder.tracking_number}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end border-t border-gray-200 pt-6">
              <Button variant="outline" onClick={handleCloseModal}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateStatus}
                loading={updatingStatus}
                disabled={newStatus === selectedOrder.status}
              >
                {newStatus === selectedOrder.status ? 'No Changes' : 'Update Status'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default function SafeOrders() {
  return (
    <ErrorBoundary>
      <Orders />
    </ErrorBoundary>
  );
}
