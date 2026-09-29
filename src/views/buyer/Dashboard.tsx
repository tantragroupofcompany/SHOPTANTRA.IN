import { useEffect, useState } from 'react';
import { Heart, HelpCircle, MapPin, ArrowRight, Truck, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import type { Order } from '../../types';

export default function BuyerDashboard() {
  const { user, profile } = useAuth();
  const { wishlist } = useApp();

  // REAL data only. This page used to hardcode two invented orders with
  // fabricated AWBs (AWB-54012398 / AWB-98120491) and couriers ShopTantra does
  // not use, so every buyer saw a ledger of parcels that were never booked. It
  // now reads this buyer's own rows from Supabase and shows an honest empty
  // state instead of inventing orders, carriers or tracking numbers.
  const [orders, setOrders] = useState<Order[]>([]);
  const [addressCount, setAddressCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      try {
        const [ordersRes, addressRes] = await Promise.all([
          supabase
            .from('orders')
            .select('*')
            .eq('buyer_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase.from('addresses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);

        if (cancelled) return;
        if (ordersRes.error) console.error('Error fetching orders:', ordersRes.error.message);
        else setOrders((ordersRes.data || []) as Order[]);

        if (addressRes.error) {
          console.error('Error fetching addresses:', addressRes.error.message);
          setAddressCount(null);
        } else {
          setAddressCount(addressRes.count ?? 0);
        }
      } catch (err) {
        console.error('Buyer dashboard load failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">
            {loading ? '—' : `${orders.length} Placed`}
          </span>
          <span className="text-[10px] text-brand-orange font-bold block mt-1">Shipped via Shipping Xpress</span>
        </div>

        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Wishlist Items</span>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">{wishlist.length} Items</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1">Synced across devices</span>
        </div>

        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Saved Addresses</span>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">
            {addressCount === null ? '—' : `${addressCount} Locations`}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1">From your address book</span>
        </div>

        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Support Tickets</span>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">
            {loading ? '—' : 'Helpdesk'}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1">
            <Link to="/buyer/tickets" className="hover:underline">View or raise a ticket</Link>
          </span>
        </div>
      </div>

      {/* Orders List Area */}
      <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-brand-navy-light/10 pb-3">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
            Your Recent Orders
          </h3>
          <Link to="/buyer/orders" className="text-[11px] font-bold text-brand-orange hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-400">
            <Loader2 size={14} className="animate-spin" /> Loading your orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">You have no orders yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Orders you place will appear here with their real status and tracking number.
            </p>
            <Link
              to="/"
              className="inline-block mt-4 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold py-2 px-4 rounded-lg text-xs"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="border border-gray-100 dark:border-brand-navy-light/10 p-4 rounded-xl space-y-3 bg-gray-50/30 dark:bg-brand-navy-dark/10"
              >
                {/* Top row */}
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-brand-navy dark:text-brand-orange">{ord.order_number || ord.id}</span>
                    <span className="text-gray-400 text-[10px] block mt-0.5">
                      Placed on: {ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-IN') : '—'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-gray-100 text-gray-600 dark:bg-brand-navy-dark dark:text-gray-300">
                    {ord.status}
                  </span>
                </div>

                {/* Tracking — only rendered when a real number exists. */}
                <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5 leading-normal">
                  <Truck size={14} className="text-brand-orange shrink-0" />
                  <span>
                    {ord.tracking_number
                      ? `Tracking / AWB: ${ord.tracking_number}`
                      : 'Tracking number is assigned once the carrier books your parcel.'}
                  </span>
                </div>

                {/* Amount and payment method */}
                <div className="flex justify-between items-center border-t border-gray-100 dark:border-brand-navy-light/5 pt-2.5">
                  <span className="font-extrabold text-sm text-brand-navy dark:text-white">
                    ₹{Number(ord.total_amount || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{ord.payment_method || 'COD'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
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
