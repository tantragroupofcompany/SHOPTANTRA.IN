import React, { useState, useEffect } from 'react';
import { Eye, Truck, Printer, FileDown, Search } from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

interface Shipment {
  id: string;
  shipmentNumber: string;
  orderId: string;
  order: {
    orderNumber: string;
    buyer: {
      fullName: string | null;
      email: string;
      phone: string | null;
    } | null;
    shippingAddress: string;
  } | null;
  courierPartner: {
    name: string;
  } | null;
  status: string;
  awbNumber: string | null;
  trackingNumber: string | null;
  trackingLink: string | null;
  codAmount: number;
  shippingCost: number;
  weight: number;
  dispatchDate: string | null;
  createdAt: string;
  trackingUpdates?: Array<{
    id: string;
    status: string;
    location: string | null;
    message: string;
    timestamp: string;
  }>;
}

const Shipments = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [manualTrackingNo, setManualTrackingNo] = useState('');
  const [manualDispatchDate, setManualDispatchDate] = useState('');

  const fetchShipments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/shipment/list?sellerId=${user.id}`);
      const result = await res.json();
      if (result.success) {
        setShipments(result.data || []);
      }
    } catch (e) {
      console.error('Error loading shipments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [user]);

  const handleUpdateStatus = async (shipmentId: string, status: string, trackingNumber?: string, dispatchDate?: string) => {
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
      if (result.success) {
        alert(`Shipment status updated to ${status} successfully!`);
        await fetchShipments();
        if (selectedShipment && selectedShipment.id === shipmentId) {
          const updated = shipments.find(s => s.id === shipmentId);
          if (updated) {
            setSelectedShipment({
              ...updated,
              status,
              trackingNumber: trackingNumber || updated.trackingNumber,
              dispatchDate: dispatchDate || updated.dispatchDate
            });
          } else {
            setIsModalOpen(false);
          }
        }
      } else {
        alert('Failed to update status: ' + result.error);
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred during status update.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleViewDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setManualTrackingNo(shipment.trackingNumber || '');
    setManualDispatchDate(shipment.dispatchDate || '');
    setIsModalOpen(true);
  };

  const filteredShipments = shipments.filter(ship => {
    if (statusFilter !== 'all' && ship.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const numMatch = ship.shipmentNumber.toLowerCase().includes(q);
      const orderMatch = ship.order?.orderNumber.toLowerCase().includes(q);
      const awbMatch = ship.awbNumber?.toLowerCase().includes(q) || ship.trackingNumber?.toLowerCase().includes(q);
      const customerMatch = ship.order?.buyer?.fullName?.toLowerCase().includes(q);
      return numMatch || orderMatch || awbMatch || customerMatch;
    }
    return true;
  });

  const getStatusVariant = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'DELIVERED') return 'success';
    if (s === 'CANCELLED') return 'danger';
    if (s === 'SHIPPED' || s === 'OUT_FOR_DELIVERY') return 'info';
    return 'warning';
  };

  const columns = [
    {
      key: 'shipmentNumber',
      header: 'Shipment ID',
      render: (row: Shipment) => <span className="font-semibold text-gray-900">{row.shipmentNumber}</span>
    },
    {
      key: 'orderNumber',
      header: 'Order ID',
      render: (row: Shipment) => <span className="text-gray-700">{row.order?.orderNumber || 'N/A'}</span>
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (row: Shipment) => {
        let name = row.order?.buyer?.fullName;
        if (!name && row.order?.shippingAddress) {
          try {
            const addr = JSON.parse(row.order.shippingAddress);
            name = addr.full_name || addr.name;
          } catch(e){ /* JSON parse error - use fallback name */ }
        }
        return <span className="text-gray-700">{name || 'Customer'}</span>;
      }
    },
    {
      key: 'trackingNumber',
      header: 'AWB / Speed Post AWB',
      render: (row: Shipment) => <span className="font-mono text-xs text-blue-600 font-bold">{row.trackingNumber || row.awbNumber || 'Pending'}</span>
    },
    {
      key: 'status',
      header: 'Shipment Status',
      render: (row: Shipment) => (
        <Badge label={row.status} variant={getStatusVariant(row.status)} size="sm" />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Shipment) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="xs" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => handleViewDetails(row)}>
            Details
          </Button>
          <a href={`/api/shipment/label?ids=${row.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs px-2.5 py-1 rounded transition-colors font-bold">
            <Printer size={12} /> Label
          </a>
        </div>
      )
    }
  ];

  const stats = {
    total: shipments.length,
    pending: shipments.filter(s => s.status.toUpperCase() === 'PENDING' || s.status.toUpperCase() === 'CONFIRMED').length,
    packed: shipments.filter(s => s.status.toUpperCase() === 'PACKED').length,
    shipped: shipments.filter(s => s.status.toUpperCase() === 'SHIPPED' || s.status.toUpperCase() === 'OUT_FOR_DELIVERY').length,
    delivered: shipments.filter(s => s.status.toUpperCase() === 'DELIVERED').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seller Shipment Console</h1>
        <p className="text-gray-500 mt-1">Manage manual India Post Speed Post shipments, print labels, and input tracking numbers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Total Shipments" value={stats.total} icon={<Truck className="w-5 h-5 text-orange-500" />} />
        <StatCard title="Pending Pickup" value={stats.pending} icon={<Truck className="w-5 h-5 text-yellow-500" />} />
        <StatCard title="Packed" value={stats.packed} icon={<Truck className="w-5 h-5 text-gray-500" />} />
        <StatCard title="In Transit" value={stats.shipped} icon={<Truck className="w-5 h-5 text-blue-500" />} />
        <StatCard title="Delivered" value={stats.delivered} icon={<Truck className="w-5 h-5 text-green-500" />} />
      </div>

      {/* Filters & Search */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Shipment ID, Order, Customer..."
              className="pl-9 w-full text-xs border border-gray-300 rounded p-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select
            label=""
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'confirmed', label: 'Confirmed / Pending' },
              { value: 'packed', label: 'Packed' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'out_for_delivery', label: 'Out for Delivery' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Shipments Grid */}
      <Card>
        <Table
          columns={columns}
          data={filteredShipments}
          loading={loading}
          keyExtractor={(ship) => ship.id}
          emptyMessage="No shipments found"
        />
      </Card>

      {/* Shipment Details Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Shipment Logistics Panel" size="lg">
        {selectedShipment && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-150 text-xs">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Shipment Reference</p>
                <p className="text-sm font-semibold text-gray-900">{selectedShipment.shipmentNumber}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Associated Order</p>
                <p className="text-sm font-semibold text-gray-900">{selectedShipment.order?.orderNumber}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Carrier Partner</p>
                <p className="text-sm font-semibold text-gray-900 uppercase">{selectedShipment.courierPartner?.name || 'India Post Speed Post'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Shipment Status</p>
                <p className="text-sm font-semibold text-gray-900 uppercase text-orange-600">{selectedShipment.status}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Dispatch Date</p>
                <p className="text-sm font-semibold text-gray-900">{selectedShipment.dispatchDate || 'N/A'}</p>
              </div>
            </div>

            {/* India Post Speed Post Manual Dispatch Form */}
            {selectedShipment.status.toUpperCase() !== 'DELIVERED' && selectedShipment.status.toUpperCase() !== 'CANCELLED' && (
              <div className="border border-blue-200 bg-blue-50/50 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-blue-900 uppercase">Update Dispatch Parameters</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">India Post AWB Tracking Number</label>
                    <input
                      type="text"
                      placeholder="e.g. SP987654321IN"
                      className="w-full text-xs border border-gray-300 rounded p-1.5 bg-white"
                      value={manualTrackingNo}
                      onChange={(e) => setManualTrackingNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Dispatch Date</label>
                    <input
                      type="date"
                      className="w-full text-xs border border-gray-300 rounded p-1.5 bg-white"
                      value={manualDispatchDate}
                      onChange={(e) => setManualDispatchDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    loading={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedShipment.id, 'PACKED')}
                  >
                    Mark Packed
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={updatingStatus}
                    onClick={() => {
                      if (!manualTrackingNo || !manualDispatchDate) {
                        alert('India Post Speed Post tracking number and Dispatch Date are required to mark Shipped.');
                        return;
                      }
                      handleUpdateStatus(selectedShipment.id, 'SHIPPED', manualTrackingNo, manualDispatchDate);
                    }}
                  >
                    Mark Shipped & Dispatch
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedShipment.id, 'OUT_FOR_DELIVERY')}
                  >
                    Mark Out For Delivery
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={updatingStatus}
                    className="bg-green-600 hover:bg-green-700 text-white border-none"
                    onClick={() => handleUpdateStatus(selectedShipment.id, 'DELIVERED')}
                  >
                    Mark Delivered
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2">
              <a
                href={`/api/shipment/label?ids=${selectedShipment.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-4 py-2 rounded font-bold inline-flex items-center gap-1.5"
              >
                <Printer size={14} /> Print Label
              </a>
              <a
                href={`/api/shipment/label?ids=${selectedShipment.id}&download=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs px-4 py-2 rounded font-bold inline-flex items-center gap-1.5"
              >
                <FileDown size={14} /> Download PDF
              </a>
            </div>

            {/* Log History */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-xs font-bold text-gray-800 uppercase mb-3">Logistics Update Timeline</h4>
              <div className="space-y-3">
                {(!selectedShipment.trackingUpdates || selectedShipment.trackingUpdates.length === 0) ? (
                  <p className="text-xs text-gray-400">No logs generated yet.</p>
                ) : (
                  selectedShipment.trackingUpdates.map((log) => (
                    <div key={log.id} className="flex gap-4 text-xs">
                      <span className="text-gray-400 font-mono w-28 shrink-0">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-800 uppercase">{log.status}</span>
                        <span className="text-gray-400 ml-1">({log.location || 'Warehouse'})</span>
                        <p className="text-gray-600">{log.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default function SafeShipments() {
  return (
    <ErrorBoundary>
      <Shipments />
    </ErrorBoundary>
  );
}
