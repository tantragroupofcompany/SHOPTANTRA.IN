import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Tag, Timer, Percent, Copy, Check, Filter, 
  ArrowRight, Flame, ShoppingBag, Info, Gift
} from 'lucide-react';
import { mockProducts } from '../data/products';

interface Coupon {
  code: string;
  discount: string;
  minSpend: string;
  description: string;
  expiry: string;
}

const OFFICIAL_COUPONS: Coupon[] = [
  { code: 'WELCOME10', discount: '10% OFF', minSpend: 'No Minimum Spend', description: 'Get 10% off on your very first order across any vendor store.', expiry: 'Dec 31, 2026' },
  { code: 'SHOPTANTRA10', discount: '₹100 Flat', minSpend: 'Min Spend ₹999', description: 'Get a flat discount of ₹100 on standard local electronics and groceries.', expiry: 'Dec 31, 2026' },
  { code: 'NEWUSER20', discount: '20% OFF', minSpend: 'Min Spend ₹1,499', description: 'Special launch coupon for new buyers on fashion and home items.', expiry: 'Nov 30, 2026' },
  { code: 'FREESHIP', discount: 'Free Shipping', minSpend: 'Min Spend ₹499', description: 'Zero shipping fee across all Swadeshi verified delivery routes.', expiry: 'Oct 31, 2026' }
];

export default function Deals() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'flash' | 'coupons' | 'plans'>('all');
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 34, seconds: 12 });

  // Simulate countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 24, minutes: 0, seconds: 0 }; // reset
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filter products with high discounts for Flash/Limited deals
  const dealProducts = useMemo(() => {
    return mockProducts
      .filter(p => p.discount >= 20)
      .sort((a, b) => b.discount - a.discount);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-navy-dark text-gray-800 dark:text-gray-200 py-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner Grid */}
        <div className="bg-gradient-to-br from-brand-navy to-brand-navy-light rounded-3xl text-white p-6 sm:p-10 mb-10 overflow-hidden relative shadow-xl border border-white/5">
          <div className="absolute right-0 bottom-0 translate-y-12 translate-x-12 opacity-10">
            <Flame size={320} className="text-brand-orange" />
          </div>

          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="bg-brand-orange text-white text-[10px] font-black uppercase px-3 py-1 rounded-md tracking-wider">
              Mega Festive Offers Live
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">
              ShopTantra Hub of Deals
            </h1>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
              Grab premium Swadeshi products at unbeatable manufacturer direct pricing, verified coupon codes, and shipping discounts.
            </p>
            
            {/* Live Flash Timer */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1.5">
                <Timer size={14} className="text-brand-orange animate-pulse" />
                Flash Sale Ends In:
              </span>
              <div className="flex gap-1.5 text-sm font-black">
                <span className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">{String(timeLeft.hours).padStart(2, '0')}h</span>
                <span>:</span>
                <span className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                <span>:</span>
                <span className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 text-brand-orange">{String(timeLeft.seconds).padStart(2, '0')}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'all', label: 'All Deals' },
            { id: 'flash', label: 'Flash Deals' },
            { id: 'coupons', label: 'Verified Coupons' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeFilter === tab.id ? 'bg-brand-orange text-white' : 'bg-white dark:bg-brand-navy text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-brand-navy-light/10 shadow-xs'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SECTION 1: VERIFIED COUPONS */}
        {(activeFilter === 'all' || activeFilter === 'coupons') && (
          <div className="mb-14">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-brand-orange/10 rounded-lg text-brand-orange">
                <Gift size={20} />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-brand-navy dark:text-white">Official Coupon Offers</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {OFFICIAL_COUPONS.map(coupon => (
                <div key={coupon.code} className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden shadow-xs hover:border-brand-orange/20 transition-all">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-orange"></div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-brand-orange/10 text-brand-orange text-[10px] font-black uppercase px-2 py-0.5 rounded">
                        {coupon.discount}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">{coupon.minSpend}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white">{coupon.code}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal max-w-xs">{coupon.description}</p>
                    <div className="text-[10px] text-gray-400 font-medium">Expires: {coupon.expiry}</div>
                  </div>

                  <button
                    onClick={() => handleCopyCode(coupon.code)}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 ${copiedCode === coupon.code ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-brand-navy-light/20 text-gray-800 dark:text-gray-200 hover:bg-brand-orange hover:text-white'}`}
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <Check size={14} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: FLASH SALE DEAL CARDS */}
        {(activeFilter === 'all' || activeFilter === 'flash') && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-brand-orange/10 rounded-lg text-brand-orange">
                <Flame size={20} />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-brand-navy dark:text-white">Flash Discount Sales</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {dealProducts.map(product => (
                <div key={product.id} className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative">
                  
                  {/* Badge */}
                  <div className="absolute top-3 left-3 bg-brand-orange text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md z-10 flex items-center gap-0.5">
                    <Percent size={10} />
                    {product.discount}% OFF
                  </div>

                  {/* Image */}
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={product.images[0]} 
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-grow space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{product.category}</span>
                    <h3 className="font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight group-hover:text-brand-orange transition-colors">
                      {product.title}
                    </h3>
                    
                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-base font-extrabold text-brand-navy dark:text-brand-orange">₹{product.price}</span>
                      <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                    </div>

                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                      Seller: {product.seller}
                    </div>
                  </div>

                  {/* View Details */}
                  <div className="px-5 pb-5 pt-0">
                    <Link
                      to={`/product/${product.id}`}
                      className="w-full bg-gray-50 dark:bg-brand-navy-light/20 hover:bg-brand-orange hover:text-white text-gray-800 dark:text-gray-200 text-[11px] font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all"
                    >
                      Grab Deal
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
