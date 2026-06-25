import { useState } from 'react';
import { ShoppingBag, Heart, HelpCircle, MapPin, ArrowRight, Truck, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { wishlist, addNotification } = useApp();

  const [orders, setOrders] = useState([
    { id: 'ORD-8921', date: '2026-06-18', carrier: 'Delhivery', awb: 'AWB-54012398', amount: 4999, status: 'Shipped', tracking: 'Out for Delivery (Noida Cargo Center)' },
    { id: 'ORD-5401', date: '2026-05-12', carrier: 'Blue Dart', awb: 'AWB-98120491', amount: 1599, status: 'Delivered', tracking: 'Package handed over to resident' }
  ]);

  const handleReturnRequest = (orderId: string) => {
    addNotification(
      'Return Request Created',
      `Return request submitted successfully for order ${orderId}. Logistic label generated.`,
      'order'
    );
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Returned' } : o))
    );
  };

  return (
    <div className="space-y-6 transition-colors duration-300">
      
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white border-l-4 border-brand-orange pl-3">
          Customer Ledger Dashboard
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Welcome back, {profile?.full_name ?? 'Valued Customer'}! Review your active cart orders and addresses.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Orders</span>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">{orders.length} Placed</span>
          <span className="text-[10px] text-brand-orange font-bold block mt-1">Delhivery & Blue Dart</span>
        </div>

        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Wishlist Items</span>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">{wishlist.length} Items</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1">Synced across devices</span>
        </div>

        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Saved Addresses</span>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">2 Locations</span>
          <span className="text-[10px] text-green-650 font-bold block mt-1">Noida, Bangalore</span>
        </div>

        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Support Tickets</span>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">0 Open</span>
          <span className="text-[10px] text-gray-455 block mt-1">Chatbot support active</span>
        </div>
      </div>

      {/* Orders List Area */}
      <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider border-b border-gray-100 dark:border-brand-navy-light/10 pb-3">
          Your Recent Orders
        </h3>

        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="border border-gray-100 dark:border-brand-navy-light/10 p-4 rounded-xl space-y-3 bg-gray-50/30 dark:bg-brand-navy-dark/10"
            >
              {/* Top row */}
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-brand-navy dark:text-brand-orange">{ord.id}</span>
                  <span className="text-gray-400 text-[10px] block mt-0.5">Placed on: {ord.date}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${ord.status === 'Delivered' ? 'bg-green-100 text-green-700' : ord.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                  {ord.status}
                </span>
              </div>

              {/* Courier info */}
              <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5 leading-normal">
                <Truck size={14} className="text-brand-orange" />
                <span>
                  Carrier: **{ord.carrier}** • AWB: **{ord.awb}**
                </span>
              </div>
              <p className="text-[10.5px] text-gray-500 italic">Tracking Status: {ord.tracking}</p>

              {/* Price and return action */}
              <div className="flex justify-between items-center border-t border-gray-100 dark:border-brand-navy-light/5 pt-2.5">
                <span className="font-extrabold text-sm text-brand-navy dark:text-white">₹{ord.amount.toLocaleString('en-IN')}</span>
                {ord.status === 'Delivered' && (
                  <button
                    onClick={() => handleReturnRequest(ord.id)}
                    className="bg-brand-orange hover:bg-brand-orange-hover text-white font-bold py-1 px-3 rounded-lg text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw size={10} />
                    Request Refund Return
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/buyer/wishlist"
          className="border-2 border-gray-200 dark:border-brand-navy-light/20 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light/30 font-bold py-2.5 rounded-xl text-center text-xs flex items-center justify-center gap-1.5"
        >
          <Heart size={14} className="text-brand-orange" />
          View Wishlist Catalog
        </Link>
        <Link
          to="/buyer/addresses"
          className="border-2 border-gray-200 dark:border-brand-navy-light/20 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light/30 font-bold py-2.5 rounded-xl text-center text-xs flex items-center justify-center gap-1.5"
        >
          <MapPin size={14} className="text-brand-orange" />
          Manage Addresses
        </Link>
        <Link
          to="/buyer/tickets"
          className="border-2 border-gray-200 dark:border-brand-navy-light/20 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light/30 font-bold py-2.5 rounded-xl text-center text-xs flex items-center justify-center gap-1.5"
        >
          <HelpCircle size={14} className="text-brand-orange" />
          Support Helpdesk
        </Link>
      </div>

    </div>
  );
}
