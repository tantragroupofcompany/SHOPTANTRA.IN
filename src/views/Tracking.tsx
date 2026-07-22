import { useState } from 'react';
import { Search, Package, Truck, Calendar, MapPin, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface TrackingMilestone {
  id: string;
  status: string;
  location: string | null;
  message: string;
  timestamp: string;
}

interface ShipmentData {
  id: string;
  shipmentNumber: string;
  status: string;
  awbNumber: string;
  courierName: string;
  trackingLink: string;
  dispatchDate?: string;
  estimatedDelivery?: string;
  updates: TrackingMilestone[];
}

interface TrackingResponse {
  success: boolean;
  orderNumber?: string;
  status?: string;
  shipments?: ShipmentData[];
  data?: ShipmentData;
  error?: string;
}

export default function Tracking() {
  const [query, setQuery] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackingResponse | null>(null);
  const [searchType, setSearchType] = useState<'order' | 'awb'>('order');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    try {
      setLoading(true);
      const url = new URL('/api/tracking', window.location.origin);

      if (searchType === 'awb') {
        url.searchParams.set('awb', query.trim());
      } else {
        url.searchParams.set('order', query.trim());
        url.searchParams.set('phone', phone.trim());
      }

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Tracking information not found.');
        setResult(null);
        return;
      }

      setResult(data);
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'CANCELLED':
      case 'RETURNED':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-orange-700 bg-orange-50 border-orange-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Track Your Shipment</h1>
        <p className="text-gray-500 max-w-md mx-auto text-sm">
          Search by Order ID + Mobile, or AWB/Tracking Number.
        </p>
      </div>

      <Card className="max-w-lg mx-auto p-6">
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant={searchType === 'order' ? 'primary' : 'secondary'}
            onClick={() => setSearchType('order')}
            className="flex-1"
          >
            Order + Mobile
          </Button>
          <Button
            type="button"
            variant={searchType === 'awb' ? 'primary' : 'secondary'}
            onClick={() => setSearchType('awb')}
            className="flex-1"
          >
            AWB / Tracking
          </Button>
        </div>

        <form onSubmit={handleTrack} className="space-y-4">
          {searchType === 'order' ? (
            <>
              <Input
                label="Order Number / ID"
                placeholder="e.g. SHP-2026-000001"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
                required
              />
              <Input
                label="Mobile Number"
                type="tel"
                placeholder="e.g. 9099989426"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                required
              />
            </>
          ) : (
            <Input
              label="AWB / Tracking Number"
              placeholder="e.g. 123456789012"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              required
            />
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full flex justify-center items-center gap-2"
            loading={loading}
          >
            <Search size={16} />
            Track Shipment
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </Card>

      {result && (
        <div className="space-y-6">
          {(result.data || result.shipments) && (
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Order reference</span>
                <h2 className="text-xl font-bold text-gray-900">{result.orderNumber || (result.data as any)?.orderNumber}</h2>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusColor(result.status || (result.data as any)?.status || 'PENDING')}`}>
                {result.status || (result.data as any)?.status}
              </div>
            </div>
          )}

          {(result.shipments || []).map((shipment: any) => (
            <Card key={shipment.id} className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-gray-400 block font-bold mb-0.5">SHIPMENT NUMBER</span>
                  <span className="font-bold text-gray-800">{shipment.shipmentNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold mb-0.5">COURIER PARTNER</span>
                  <span className="font-bold text-gray-800 flex items-center gap-1">
                    <Truck size={14} className="text-orange-500" />
                    {shipment.courierName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold mb-0.5">AWB NUMBER</span>
                  <span className="font-mono font-bold text-gray-800">{shipment.awbNumber || 'PENDING'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold mb-0.5">TRACKING LINK</span>
                  {shipment.awbNumber ? (
                    <a href={shipment.trackingLink} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 font-bold underline">
                      Track on Website
                    </a>
                  ) : (
                    <span className="text-gray-400">Not Available</span>
                  )}
                </div>
              </div>

              {(shipment.dispatchDate || shipment.estimatedDelivery) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {shipment.dispatchDate && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-orange-500" />
                      <span className="text-gray-600">Dispatch Date: <span className="font-semibold text-gray-800">{new Date(shipment.dispatchDate).toLocaleString('en-IN')}</span></span>
                    </div>
                  )}
                  {shipment.estimatedDelivery && (
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-orange-500" />
                      <span className="text-gray-600">Estimated Delivery: <span className="font-semibold text-gray-800">{new Date(shipment.estimatedDelivery).toLocaleString('en-IN')}</span></span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={16} className="text-orange-500" />
                  Delivery Journey Timeline
                </h3>

                {(!shipment.updates || shipment.updates.length === 0) ? (
                  <p className="text-gray-400 text-xs pl-6">No checkpoints recorded yet. Shipping label generated.</p>
                ) : (
                  <div className="relative border-l-2 border-gray-100 ml-3 pl-6 space-y-6">
                    {shipment.updates.map((update: TrackingMilestone, idx: number) => (
                      <div key={update.id || idx} className="relative">
                        <span className={`absolute -left-[31px] top-0.5 rounded-full p-0.5 bg-white border-2 ${idx === 0 ? 'border-orange-500 text-orange-500' : 'border-gray-300 text-gray-400'}`}>
                          <CheckCircle2 size={12} />
                        </span>
                        <div className="space-y-1">
                          <div className="flex justify-between items-start">
                            <span className={`text-xs font-bold ${idx === 0 ? 'text-orange-700 font-extrabold' : 'text-gray-700'}`}>
                              {update.status}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {new Date(update.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 leading-normal">{update.message}</p>
                          {update.location && (
                            <span className="text-[10px] text-gray-400 font-bold flex items-center gap-0.5 mt-0.5">
                              <MapPin size={10} />
                              {update.location}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}

          {result.data && !result.shipments && (
            <Card className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-gray-400 block font-bold mb-0.5">SHIPMENT NUMBER</span>
                  <span className="font-bold text-gray-800">{result.data.shipmentNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold mb-0.5">COURIER PARTNER</span>
                  <span className="font-bold text-gray-800 flex items-center gap-1">
                    <Truck size={14} className="text-orange-500" />
                    {result.data.courierName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold mb-0.5">AWB NUMBER</span>
                  <span className="font-mono font-bold text-gray-800">{result.data.awbNumber || 'PENDING'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold mb-0.5">TRACKING LINK</span>
                  {result.data.awbNumber ? (
                    <a href={result.data.trackingLink} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 font-bold underline">
                      Track on Website
                    </a>
                  ) : (
                    <span className="text-gray-400">Not Available</span>
                  )}
                </div>
              </div>

              {(result.data.dispatchDate || result.data.estimatedDelivery) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {result.data.dispatchDate && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-orange-500" />
                      <span className="text-gray-600">Dispatch Date: <span className="font-semibold text-gray-800">{new Date(result.data.dispatchDate).toLocaleString('en-IN')}</span></span>
                    </div>
                  )}
                  {result.data.estimatedDelivery && (
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-orange-500" />
                      <span className="text-gray-600">Estimated Delivery: <span className="font-semibold text-gray-800">{new Date(result.data.estimatedDelivery).toLocaleString('en-IN')}</span></span>
                    </div>
                  )}
                </div>
              )}

              {result.data.updates && result.data.updates.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={16} className="text-orange-500" />
                    Delivery Journey Timeline
                  </h3>
                  <div className="relative border-l-2 border-gray-100 ml-3 pl-6 space-y-6">
                    {result.data.updates.map((update, idx) => (
                      <div key={update.id || idx} className="relative">
                        <span className={`absolute -left-[31px] top-0.5 rounded-full p-0.5 bg-white border-2 ${idx === 0 ? 'border-orange-500 text-orange-500' : 'border-gray-300 text-gray-400'}`}>
                          <CheckCircle2 size={12} />
                        </span>
                        <div className="space-y-1">
                          <div className="flex justify-between items-start">
                            <span className={`text-xs font-bold ${idx === 0 ? 'text-orange-700 font-extrabold' : 'text-gray-700'}`}>{update.status}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{new Date(update.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                          <p className="text-xs text-gray-500 leading-normal">{update.message}</p>
                          {update.location && (
                            <span className="text-[10px] text-gray-400 font-bold flex items-center gap-0.5 mt-0.5">
                              <MapPin size={10} />
                              {update.location}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}