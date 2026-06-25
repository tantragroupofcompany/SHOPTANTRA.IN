import { useState } from 'react';
import {
  Smartphone,
  ChevronLeft,
  Search,
  ShoppingCart,
  Home as HomeIcon,
  Heart,
  User as UserIcon,
  TrendingUp,
  Package,
  PlusCircle,
  Bell,
  Star,
  CheckCircle,
  TrendingDown,
  Percent,
  Settings
} from 'lucide-react';
import { mockProducts } from '../data/products';

export default function MobilePreview() {
  const [customerScreen, setCustomerScreen] = useState<'home' | 'product' | 'cart'>('home');
  const [sellerScreen, setSellerScreen] = useState<'dashboard' | 'products' | 'orders'>('dashboard');

  const customerProducts = mockProducts.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white mb-3 border-l-4 border-brand-orange pl-3">
        Mobile App UI Simulator
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">
        Interact with the simulated Android & iOS screens to preview the branding across the Customer and Seller apps.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 justify-items-center">

        {/* 1. iOS App Simulator (Customer App) */}
        <div className="space-y-4 w-full max-w-sm">
          <div className="flex justify-between items-center px-4">
            <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 text-sm">
              <Smartphone size={16} className="text-brand-orange" />
              Customer Mobile App (iOS)
            </span>
            <div className="flex gap-1">
              <button onClick={() => setCustomerScreen('home')} className={`px-2.5 py-1 text-[10px] font-bold rounded ${customerScreen === 'home' ? 'bg-brand-orange text-white' : 'bg-gray-100 dark:bg-brand-navy text-gray-500'}`}>Home</button>
              <button onClick={() => setCustomerScreen('product')} className={`px-2.5 py-1 text-[10px] font-bold rounded ${customerScreen === 'product' ? 'bg-brand-orange text-white' : 'bg-gray-100 dark:bg-brand-navy text-gray-500'}`}>Product</button>
              <button onClick={() => setCustomerScreen('cart')} className={`px-2.5 py-1 text-[10px] font-bold rounded ${customerScreen === 'cart' ? 'bg-brand-orange text-white' : 'bg-gray-100 dark:bg-brand-navy text-gray-500'}`}>Cart</button>
            </div>
          </div>

          {/* iPhone Frame */}
          <div className="relative mx-auto w-[310px] h-[620px] bg-brand-navy rounded-[40px] p-3 shadow-2xl border-4 border-brand-navy-light/35 overflow-hidden flex flex-col justify-between">
            {/* Top Speaker Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-4.5 bg-brand-navy-dark rounded-full z-20 flex justify-center items-start pt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-800 mr-2" />
              <div className="w-10 h-0.5 rounded bg-gray-850" />
            </div>

            {/* Simulated iPhone Screen */}
            <div className="flex-grow bg-gray-50 text-gray-800 rounded-[30px] overflow-hidden flex flex-col justify-between relative z-10 text-xs">
              
              {/* Screen Header */}
              <div className="bg-brand-navy text-white pt-6 pb-3 px-4 flex justify-between items-center shrink-0">
                {customerScreen !== 'home' ? (
                  <button onClick={() => setCustomerScreen('home')} className="flex items-center gap-0.5 text-gray-300">
                    <ChevronLeft size={16} />
                    Back
                  </button>
                ) : (
                  <img src="/SHOPTANTRA.png" alt="Logo" className="h-5 w-auto" />
                )}
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-brand-orange" />
                  <ShoppingCart size={14} onClick={() => setCustomerScreen('cart')} className="cursor-pointer" />
                </div>
              </div>

              {/* Screen Body */}
              <div className="flex-grow overflow-y-auto bg-gray-100 p-3 space-y-3">
                
                {customerScreen === 'home' && (
                  <>
                    {/* Hero Ad banner */}
                    <div className="bg-gradient-to-r from-brand-orange to-amber-500 text-white rounded-xl p-3 flex justify-between items-center relative overflow-hidden">
                      <div className="space-y-1 z-10">
                        <span className="bg-white/20 text-[8px] uppercase font-extrabold px-1 rounded">Flash Sale</span>
                        <h4 className="font-extrabold text-sm leading-tight">Mantra Sound<br/>Flat 44% Off!</h4>
                        <button className="bg-white text-brand-orange font-bold px-2.5 py-0.5 rounded text-[9px] mt-1 shadow-sm">Shop Now</button>
                      </div>
                      <Percent size={48} className="absolute -right-3 -bottom-3 text-white/10 rotate-12" />
                    </div>

                    {/* Small category buttons */}
                    <div>
                      <h5 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Categories</h5>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['Electronics', 'Fashion', 'Grocery', 'Beauty'].map((cat, idx) => (
                          <div key={idx} className="bg-white p-1.5 rounded-lg text-center shadow-xs border border-gray-100">
                            <span className="text-[16px] block mb-0.5">{['📱', '👕', '🌾', '💄'][idx]}</span>
                            <span className="text-[7.5px] font-bold text-gray-600 truncate block">{cat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Product Grids */}
                    <div>
                      <h5 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Trending Now</h5>
                      <div className="grid grid-cols-2 gap-2.5">
                        {customerProducts.map((p) => (
                          <div key={p.id} onClick={() => setCustomerScreen('product')} className="bg-white rounded-lg overflow-hidden shadow-xs cursor-pointer border border-gray-100 flex flex-col justify-between">
                            <img src={p.images[0]} alt={p.title} className="w-full h-20 object-cover" />
                            <div className="p-2 space-y-1">
                              <h6 className="font-semibold truncate text-gray-800 text-[9px]">{p.title}</h6>
                              <div className="flex justify-between items-center mt-1">
                                <span className="font-bold text-brand-navy">₹{p.price}</span>
                                <span className="text-[7px] text-gray-450 line-through">₹{p.originalPrice}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {customerScreen === 'product' && (
                  <div className="bg-white rounded-xl p-3 space-y-3 shadow-xs border border-gray-100">
                    <img src={customerProducts[0].images[0]} alt="p" className="w-full h-36 object-contain bg-gray-50 rounded-lg" />
                    <div className="space-y-1.5">
                      <span className="text-[8px] bg-brand-orange/10 text-brand-orange font-bold px-1.5 py-0.5 rounded">Electronics</span>
                      <h4 className="font-bold text-gray-800 leading-tight text-xs">{customerProducts[0].title}</h4>
                      <div className="flex items-center gap-1">
                        <div className="flex text-brand-gold"><Star size={10} className="fill-brand-gold" /></div>
                        <span className="text-[9px] text-gray-500">4.8 (324 reviews)</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-extrabold text-brand-orange">₹{customerProducts[0].price}</span>
                        <span className="text-[9px] text-gray-400 line-through">₹{customerProducts[0].originalPrice}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-normal">{customerProducts[0].description}</p>
                    <button onClick={() => setCustomerScreen('cart')} className="w-full bg-brand-navy hover:bg-brand-navy-light text-white font-bold py-2 rounded-lg text-[10px] mt-2">
                      Add to Cart
                    </button>
                  </div>
                )}

                {customerScreen === 'cart' && (
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-3 shadow-xs border border-gray-100 space-y-2.5">
                      {customerProducts.slice(0, 2).map((p, idx) => (
                        <div key={idx} className="flex gap-2.5 items-center border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                          <img src={p.images[0]} alt="p" className="w-10 h-10 rounded object-cover" />
                          <div className="flex-grow min-w-0">
                            <h6 className="font-bold text-gray-800 truncate text-[9px]">{p.title}</h6>
                            <span className="text-[9px] font-bold text-brand-orange">₹{p.price}</span>
                          </div>
                          <span className="text-[9px] text-gray-400">Qty: 1</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-white rounded-xl p-3 shadow-xs border border-gray-100 text-[10px] space-y-1.5">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-bold">₹{customerProducts[0].price + customerProducts[1].price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxes (GST):</span>
                        <span className="font-bold">Included</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-100 pt-1.5 text-brand-navy font-extrabold">
                        <span>Total Paid:</span>
                        <span>₹{customerProducts[0].price + customerProducts[1].price}</span>
                      </div>
                    </div>
                    
                    <button onClick={() => {
                      alert('Order simulated successfully!');
                      setCustomerScreen('home');
                    }} className="w-full bg-brand-orange text-white font-bold py-2 rounded-lg text-[10px]">
                      Place Order (UPI/Cards)
                    </button>
                  </div>
                )}

              </div>

              {/* Screen Footer Tabbar */}
              <div className="bg-white border-t border-gray-200 py-2.5 px-4 flex justify-between items-center text-gray-400 shrink-0 select-none">
                <div onClick={() => setCustomerScreen('home')} className={`flex flex-col items-center gap-0.5 cursor-pointer ${customerScreen === 'home' ? 'text-brand-orange' : ''}`}>
                  <HomeIcon size={14} />
                  <span className="text-[7.5px] font-bold">Home</span>
                </div>
                <div onClick={() => setCustomerScreen('product')} className={`flex flex-col items-center gap-0.5 cursor-pointer ${customerScreen === 'product' ? 'text-brand-orange' : ''}`}>
                  <Heart size={14} />
                  <span className="text-[7.5px] font-bold">Wishlist</span>
                </div>
                <div onClick={() => setCustomerScreen('cart')} className={`flex flex-col items-center gap-0.5 cursor-pointer ${customerScreen === 'cart' ? 'text-brand-orange' : ''}`}>
                  <ShoppingCart size={14} />
                  <span className="text-[7.5px] font-bold">Cart</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <UserIcon size={14} />
                  <span className="text-[7.5px] font-bold">Profile</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 2. Android App Simulator (Seller App) */}
        <div className="space-y-4 w-full max-w-sm">
          <div className="flex justify-between items-center px-4">
            <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 text-sm">
              <Smartphone size={16} className="text-brand-orange" />
              Seller Console App (Android)
            </span>
            <div className="flex gap-1">
              <button onClick={() => setSellerScreen('dashboard')} className={`px-2.5 py-1 text-[10px] font-bold rounded ${sellerScreen === 'dashboard' ? 'bg-brand-navy text-white' : 'bg-gray-100 dark:bg-brand-navy text-gray-500'}`}>Stats</button>
              <button onClick={() => setSellerScreen('products')} className={`px-2.5 py-1 text-[10px] font-bold rounded ${sellerScreen === 'products' ? 'bg-brand-navy text-white' : 'bg-gray-100 dark:bg-brand-navy text-gray-500'}`}>Catalog</button>
              <button onClick={() => setSellerScreen('orders')} className={`px-2.5 py-1 text-[10px] font-bold rounded ${sellerScreen === 'orders' ? 'bg-brand-navy text-white' : 'bg-gray-100 dark:bg-brand-navy text-gray-500'}`}>Orders</button>
            </div>
          </div>

          {/* Android Frame */}
          <div className="relative mx-auto w-[310px] h-[620px] bg-brand-navy-light rounded-[36px] p-2.5 shadow-2xl border-4 border-brand-navy/30 overflow-hidden flex flex-col justify-between">
            {/* Top Camera Punch Hole */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-brand-navy rounded-full z-20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-950" />
            </div>

            {/* Simulated Android Screen */}
            <div className="flex-grow bg-gray-50 text-gray-800 rounded-[28px] overflow-hidden flex flex-col justify-between relative z-10 text-xs">
              
              {/* Screen Header */}
              <div className="bg-brand-navy-light text-white pt-5 pb-3 px-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-6.5 h-6.5 bg-brand-orange rounded-full flex items-center justify-center text-[9px] font-bold">ST</span>
                  <div className="leading-tight">
                    <span className="text-[10px] font-bold block">Tantra Store Console</span>
                    <span className="text-[7.5px] text-gray-300">ID: sel-101 • Verified</span>
                  </div>
                </div>
                <Settings size={14} className="text-gray-300" />
              </div>

              {/* Screen Body */}
              <div className="flex-grow overflow-y-auto bg-gray-100 p-3 space-y-3">
                
                {sellerScreen === 'dashboard' && (
                  <>
                    {/* Small metrics grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2.5 rounded-xl shadow-xs border border-gray-100">
                        <span className="text-[8px] font-bold text-gray-400 uppercase block">Total Sales</span>
                        <span className="text-xs font-black text-brand-navy mt-0.5 block">₹1,42,890</span>
                        <span className="text-[8.5px] text-green-600 font-bold flex items-center gap-0.5 mt-0.5">
                          <TrendingUp size={8} />
                          +12% this week
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl shadow-xs border border-gray-100">
                        <span className="text-[8px] font-bold text-gray-400 uppercase block">Pending Orders</span>
                        <span className="text-xs font-black text-brand-orange mt-0.5 block">14 Packages</span>
                        <span className="text-[8.5px] text-amber-600 font-bold mt-0.5 block">8 to ship today</span>
                      </div>
                    </div>

                    {/* SVG Analytics Mini Chart */}
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-xs space-y-2">
                      <span className="text-[9.5px] font-bold text-gray-750 block">Weekly Orders volume</span>
                      <svg viewBox="0 0 100 40" className="w-full h-14 overflow-visible">
                        <path
                          d="M0 35 L 20 28 L 40 32 L 60 15 L 80 22 L 100 5"
                          fill="none"
                          stroke="#f76b00"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M0 35 L 20 28 L 40 32 L 60 15 L 80 22 L 100 5 L 100 40 L 0 40 Z"
                          fill="url(#grad)"
                          opacity="0.15"
                        />
                        <defs>
                          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f76b00" />
                            <stop offset="100%" stopColor="#ffffff" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    {/* Quick actions panel */}
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-xs">
                      <h6 className="font-bold text-[9px] text-gray-450 uppercase mb-2">Merchant Tools</h6>
                      <div className="grid grid-cols-3 gap-2 text-center text-[8.5px] text-gray-600 font-bold">
                        <div onClick={() => setSellerScreen('products')} className="space-y-1.5 p-1 rounded hover:bg-gray-50 cursor-pointer">
                          <PlusCircle size={18} className="text-brand-orange mx-auto" />
                          <span>Add Product</span>
                        </div>
                        <div onClick={() => setSellerScreen('orders')} className="space-y-1.5 p-1 rounded hover:bg-gray-50 cursor-pointer">
                          <Package size={18} className="text-brand-navy mx-auto" />
                          <span>Orders</span>
                        </div>
                        <div className="space-y-1.5 p-1 rounded hover:bg-gray-50 cursor-pointer">
                          <TrendingUp size={18} className="text-green-600 mx-auto" />
                          <span>Settlements</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {sellerScreen === 'products' && (
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[10px]">Product Listings (24 active)</span>
                      <button className="bg-brand-navy text-white text-[8px] font-bold px-2 py-0.5 rounded">Add New</button>
                    </div>
                    <div className="bg-white rounded-xl p-2 shadow-xs border border-gray-100 space-y-2">
                      {customerProducts.map((p, idx) => (
                        <div key={idx} className="flex gap-2 items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                          <img src={p.images[0]} alt="p" className="w-8 h-8 rounded object-cover" />
                          <div className="flex-grow min-w-0">
                            <h6 className="font-bold truncate text-gray-800 text-[9px]">{p.title}</h6>
                            <span className="text-[9.5px] text-brand-orange font-bold">₹{p.price}</span>
                          </div>
                          <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-extrabold">In Stock</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sellerScreen === 'orders' && (
                  <div className="space-y-2.5">
                    <span className="font-bold text-[10px] block">Active Dispatches</span>
                    <div className="space-y-2">
                      {[
                        { orderId: 'ORD-5401', client: 'Aman Verma', item: 'TantraSound ANC Headset', time: 'Pending Pickup', status: 'ready' },
                        { orderId: 'ORD-2993', client: 'Lalit Patel', item: 'A2 Desi Cow Ghee (1L)', time: 'Shipped (Delhivery)', status: 'shipped' }
                      ].map((ord, idx) => (
                        <div key={idx} className="bg-white rounded-xl p-3 border border-gray-100 shadow-xs space-y-2">
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="font-bold text-gray-800">{ord.orderId}</span>
                            <span className="text-gray-400">{ord.time}</span>
                          </div>
                          <div className="text-[10px] text-gray-600">
                            <span className="font-semibold block text-gray-800">{ord.item}</span>
                            <span>Buyer: {ord.client}</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-gray-50 pt-2">
                            <span className="text-[8px] bg-orange-100 text-brand-orange px-2 py-0.5 rounded font-extrabold uppercase">{ord.status}</span>
                            <button className="bg-brand-navy-light text-white text-[8px] font-bold px-2 py-1 rounded">Generate Label</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Screen Footer Tabbar */}
              <div className="bg-white border-t border-gray-200 py-2 px-4 flex justify-between items-center text-gray-400 shrink-0 select-none">
                <div onClick={() => setSellerScreen('dashboard')} className={`flex flex-col items-center gap-0.5 cursor-pointer ${sellerScreen === 'dashboard' ? 'text-brand-navy-light' : ''}`}>
                  <HomeIcon size={14} />
                  <span className="text-[7.5px] font-bold">Console</span>
                </div>
                <div onClick={() => setSellerScreen('products')} className={`flex flex-col items-center gap-0.5 cursor-pointer ${sellerScreen === 'products' ? 'text-brand-navy-light' : ''}`}>
                  <Package size={14} />
                  <span className="text-[7.5px] font-bold">Catalog</span>
                </div>
                <div onClick={() => setSellerScreen('orders')} className={`flex flex-col items-center gap-0.5 cursor-pointer ${sellerScreen === 'orders' ? 'text-brand-navy-light' : ''}`}>
                  <ShoppingCart size={14} />
                  <span className="text-[7.5px] font-bold">Shipments</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
