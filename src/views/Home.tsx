import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Smartphone,
  ShoppingBag,
  TrendingUp,
  Zap,
  Star,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Send,
  Check,
  Store,
  Sparkles,
  Flame,
  Award,
  Clock,
  Compass,
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import { mockProducts, CATEGORIES_LIST, Product } from '../data/products';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function Home() {
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist, addNotification } = useApp();

  // Banners for Hero Section Slider
  const banners = [
    {
      title: "India's Premium Multi-Vendor Marketplace",
      description: "Direct from verified local manufacturers to your doorstep. Buy Swadeshi, support Indian craftsmanship.",
      bg: "from-brand-navy via-brand-navy/90 to-brand-navy-light",
      cta: "Explore Catalog",
      tag: "ESTD. 2026",
      link: "/products"
    },
    {
      title: "🌾 Pampore Saffron & Gir Cow Ghee Flat 50% Off!",
      description: "Get pure Vedic Bilona churned A2 Ghee and original Grade-A Kashmiri Mongra Kesar. Limited festive batch.",
      bg: "from-brand-orange via-brand-orange-hover to-amber-600",
      cta: "Shop Groceries",
      tag: "SWADESHI FARMS SPECIAL",
      link: "/products?category=Grocery"
    },
    {
      title: "🎧 TantraSound Pro 500 Noise Cancelling Audio",
      description: "Experience active hybrid noise cancellation with 50-hour battery life. Designed for audiophiles.",
      bg: "from-brand-navy-light via-brand-navy-dark to-slate-900",
      cta: "Grab ANC Headset",
      tag: "NEW ELECTRONICS LAUNCH",
      link: "/product/prod-1"
    }
  ];

  const [activeBanner, setActiveBanner] = useState(0);

  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchDbProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');

        if (data && !error) {
          const formatted: Product[] = [];
          for (const item of data) {
            let imagesArray: string[] = [];
            if (item.images) {
              try {
                const parsed = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
                imagesArray = Array.isArray(parsed) 
                  ? parsed.map((img: any) => typeof img === 'string' ? img : (img.url || '')) 
                  : [];
              } catch (e) {
                console.warn('Failed to parse home product images:', e);
              }
            }
            if (imagesArray.length === 0) {
              imagesArray = ['https://images.unsplash.com/photo-1578500494198-246f612d3b3d'];
            }

            let variants = { colors: [], sizes: [] };
            if (item.variants) {
              try {
                variants = typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants;
              } catch (e) {
                console.warn('Failed to parse home product variants:', e);
              }
            }

            let specifications = {};
            if (item.specifications) {
              try {
                specifications = typeof item.specifications === 'string' ? JSON.parse(item.specifications) : item.specifications;
              } catch (e) {
                console.warn('Failed to parse home product specifications:', e);
              }
            }

            // Get seller store name
            let sellerName = 'Tantra Store';
            try {
              const { data: sellerData } = await supabase
                .from('sellers')
                .select('store_name')
                .eq('id', item.sellerId || item.seller_id)
                .single();
              if (sellerData?.store_name) {
                sellerName = sellerData.store_name;
              }
            } catch (e) {
              console.warn('Failed to fetch home product seller:', e);
            }

            const price = Number(item.price);
            const comparePrice = Number(item.comparePrice || item.compare_price || price * 1.3);
            const discount = comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

            formatted.push({
              id: item.id,
              title: item.title,
              seller: sellerName,
              sellerId: item.sellerId || item.seller_id,
              price: price,
              originalPrice: comparePrice,
              discount: discount,
              rating: Number(item.rating || 4.5),
              reviewsCount: Number(item.reviewsCount || item.reviews_count || 0),
              category: item.category || 'General',
              images: imagesArray,
              description: item.description || '',
              stockStatus: item.stock > 5 ? 'In Stock' : item.stock > 0 ? 'Low Stock' : 'Out of Stock',
              stockCount: item.stock || 0,
              variants: variants || { colors: [], sizes: [] },
              specifications: specifications || {},
              reviews: []
            });
          }
          setDbProducts(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch products on home:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchDbProducts();
  }, []);

  const allProducts = useMemo(() => {
    return [...mockProducts, ...dbProducts];
  }, [dbProducts]);

  // Auto scroll banners
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Flash Sale Timer State
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // FAQ Accordion State
  const [faqActive, setFaqActive] = useState<number | null>(null);
  const toggleFaq = (index: number) => {
    setFaqActive(faqActive === index ? null : index);
  };

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactName && contactEmail && contactMsg) {
      setContactSent(true);
      addNotification(
        'Message Submitted',
        `Thanks ${contactName}! Our team will email you at ${contactEmail} soon.`,
        'system'
      );
      setContactName('');
      setContactEmail('');
      setContactMsg('');
      setTimeout(() => setContactSent(false), 5000);
    }
  };

  // Categories icons list mapping
  const categoryIcons: Record<string, string> = {
    'Electronics': '📱',
    'Fashion': '👕',
    'Home & Kitchen': '🍳',
    'Beauty': '💄',
    'Grocery': '🌾',
    'Books': '📚',
    'Toys': '🧸',
    'Sports': '🏸',
    'Automotive': '🚗',
    'Mobile Accessories': '🔌',
    'Furniture': '🪑',
    'Health': '💊'
  };

  const ratingStars = (rating: number) => (
    <div className="flex items-center gap-0.5 text-brand-gold">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < Math.floor(rating) ? 'fill-brand-gold text-brand-gold' : 'text-gray-300 dark:text-gray-600'}
        />
      ))}
    </div>
  );

  return (
    <div className="w-full overflow-hidden transition-colors duration-300">
      
      {/* 1. HERO SECTION (BANNER SLIDER) */}
      <section className="relative w-full h-[460px] sm:h-[520px] overflow-hidden flex items-center bg-brand-navy text-white">
        <div className="absolute inset-0 z-0">
          {banners.map((b, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 bg-gradient-to-r ${b.bg} transition-opacity duration-1000 ease-in-out ${idx === activeBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            />
          ))}
          {/* Subtle logo patterns */}
          <div className="absolute inset-0 opacity-5 z-20 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20 w-full">
          <div className="max-w-2xl space-y-6">
            <span className="inline-block bg-brand-orange/25 border border-brand-orange/45 text-brand-orange text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider animate-pulse">
              {banners[activeBanner].tag}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight drop-shadow-sm select-none">
              {banners[activeBanner].title}
            </h1>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed max-w-xl">
              {banners[activeBanner].description}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to={banners[activeBanner].link}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md flex items-center gap-2 transform hover:scale-103"
              >
                {banners[activeBanner].cta}
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/register/seller"
                className="border-2 border-white/30 text-white hover:border-white hover:bg-white/10 font-bold py-3 px-8 rounded-xl transition-all"
              >
                Become a Seller
              </Link>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-25 flex gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveBanner(idx)}
              className={`w-3 h-3 rounded-full transition-all ${idx === activeBanner ? 'bg-brand-orange w-8' : 'bg-white/40'}`}
            />
          ))}
        </div>
      </section>

      {/* 2. CATEGORIES SECTION */}
      <section className="py-12 bg-white dark:bg-brand-navy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white mb-2.5">
              Shop by Category
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Explore products across our 12 dedicated commerce categories</p>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {CATEGORIES_LIST.map((cat) => (
              <Link
                key={cat}
                to={`/products?category=${encodeURIComponent(cat)}`}
                className="group bg-gray-50/70 dark:bg-brand-navy/40 border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-4 text-center hover:bg-brand-orange/10 hover:border-brand-orange hover:scale-105 transition-all"
              >
                <span className="text-2xl block mb-2">{categoryIcons[cat] ?? '📦'}</span>
                <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 group-hover:text-brand-orange transition-colors truncate block">
                  {cat}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. TRENDING PRODUCTS */}
      <section className="py-14 bg-gray-50/50 dark:bg-brand-navy/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-baseline mb-8">
            <h3 className="text-xl sm:text-2xl font-extrabold text-brand-navy dark:text-white border-l-4 border-brand-orange pl-3">
              Trending Products
            </h3>
            <Link to="/products" className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
              View All
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {allProducts.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="group bg-white dark:bg-brand-navy rounded-2xl border border-gray-100 dark:border-brand-navy-light/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="aspect-square bg-gray-50 dark:bg-brand-navy-dark relative overflow-hidden">
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute top-3 left-3 bg-brand-orange text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Flame size={10} className="fill-white" />
                    Trending
                  </span>
                </div>
                <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <Link to={`/product/${p.id}`} className="font-bold text-gray-800 dark:text-gray-100 text-xs sm:text-sm hover:text-brand-orange line-clamp-2 leading-tight block">
                      {p.title}
                    </Link>
                    <span className="text-[10px] text-gray-400 block">{p.seller}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-50 dark:border-brand-navy-light/5 pt-3">
                    <span className="font-extrabold text-sm text-brand-navy dark:text-brand-orange">
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-400 line-through">₹{p.originalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. BEST SELLERS */}
      <section className="py-14 bg-white dark:bg-brand-navy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-baseline mb-8">
            <h3 className="text-xl sm:text-2xl font-extrabold text-brand-navy dark:text-white border-l-4 border-brand-orange pl-3">
              Best Sellers
            </h3>
            <Link to="/products" className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
              View All
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {allProducts.slice(4, 8).map((p) => (
              <div
                key={p.id}
                className="group bg-white dark:bg-brand-navy rounded-2xl border border-gray-100 dark:border-brand-navy-light/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="aspect-square bg-gray-50 dark:bg-brand-navy-dark relative overflow-hidden">
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute top-3 left-3 bg-brand-gold text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Award size={10} className="fill-white" />
                    Best Seller
                  </span>
                </div>
                <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <Link to={`/product/${p.id}`} className="font-bold text-gray-800 dark:text-gray-100 text-xs sm:text-sm hover:text-brand-orange line-clamp-2 leading-tight block">
                      {p.title}
                    </Link>
                    <div className="flex items-center gap-1.5 mt-1">
                      {ratingStars(p.rating)}
                      <span className="text-[10px] text-gray-400">({p.reviewsCount})</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-50 dark:border-brand-navy-light/5 pt-3">
                    <span className="font-extrabold text-sm text-brand-navy dark:text-brand-orange">
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-400 line-through">₹{p.originalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FLASH SALE SECTION */}
      <section className="py-12 bg-gradient-to-r from-brand-orange to-amber-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Zap size={28} className="fill-white text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider">Mega Flash Sale</h3>
                <p className="text-xs text-orange-100">Festive discounts, limited inventory stocks only!</p>
              </div>
            </div>
            
            {/* Live Ticking Countdown Timer */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs uppercase font-extrabold tracking-wider text-orange-150 mr-1.5">Ending In:</span>
              <div className="bg-brand-navy px-3 py-1.5 rounded-lg text-center shadow">
                <span className="text-base font-black font-mono">{timeLeft.hours.toString().padStart(2, '0')}</span>
                <span className="text-[8px] uppercase tracking-wide block font-semibold text-gray-300">Hrs</span>
              </div>
              <span className="text-lg font-black">:</span>
              <div className="bg-brand-navy px-3 py-1.5 rounded-lg text-center shadow">
                <span className="text-base font-black font-mono">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                <span className="text-[8px] uppercase tracking-wide block font-semibold text-gray-300">Min</span>
              </div>
              <span className="text-lg font-black">:</span>
              <div className="bg-brand-navy px-3 py-1.5 rounded-lg text-center shadow">
                <span className="text-base font-black font-mono text-brand-orange">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                <span className="text-[8px] uppercase tracking-wide block font-semibold text-gray-300">Sec</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-gray-800">
            {allProducts.slice(8, 12).map((p) => {
              const itemsLeft = Math.floor(2 + Math.random() * 8);
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl overflow-hidden p-4 shadow-md flex flex-col justify-between h-full space-y-3.5 relative border border-white/10"
                >
                  <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative">
                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded">
                      -{p.discount}% OFF
                    </span>
                  </div>
                  <div className="space-y-2 flex-grow flex flex-col justify-between">
                    <div>
                      <Link to={`/product/${p.id}`} className="font-bold text-xs sm:text-sm text-gray-800 hover:text-brand-orange line-clamp-2 leading-tight block">
                        {p.title}
                      </Link>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="font-extrabold text-sm text-brand-navy">₹{p.price}</span>
                        <span className="text-[10px] text-gray-400 line-through">₹{p.originalPrice}</span>
                      </div>
                    </div>
                    {/* Stock remaining bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-red-600 h-1.5 rounded-full" style={{ width: `${(itemsLeft / 12) * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-red-600 font-bold block">Only {itemsLeft} items left in stock!</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. FEATURED BRANDS */}
      <section className="py-10 bg-white dark:bg-brand-navy-dark border-b border-gray-150/40 dark:border-brand-navy-light/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Partnerships</span>
            <h4 className="text-sm font-extrabold text-gray-600 dark:text-gray-400 uppercase mt-1">Featured Indian Brands</h4>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-60 grayscale hover:grayscale-0 transition-all">
            {['Swadeshi Farms', 'Tantra Sound', 'Vajra Sports', 'Shiva Designs', 'Swadeshi Veda', 'Vidya Books'].map((brand, idx) => (
              <span key={idx} className="font-black tracking-wider text-sm sm:text-base text-gray-500 dark:text-gray-300">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 7. NEW ARRIVALS */}
      <section className="py-14 bg-gray-50/50 dark:bg-brand-navy/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-baseline mb-8">
            <h3 className="text-xl sm:text-2xl font-extrabold text-brand-navy dark:text-white border-l-4 border-brand-orange pl-3">
              New Arrivals
            </h3>
            <Link to="/products" className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
              View All
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {allProducts.slice(12, 16).map((p) => (
              <div
                key={p.id}
                className="group bg-white dark:bg-brand-navy rounded-2xl border border-gray-100 dark:border-brand-navy-light/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="aspect-square bg-gray-50 dark:bg-brand-navy-dark relative overflow-hidden">
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute top-3 left-3 bg-brand-navy text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                    New
                  </span>
                </div>
                <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <Link to={`/product/${p.id}`} className="font-bold text-gray-800 dark:text-gray-100 text-xs sm:text-sm hover:text-brand-orange line-clamp-2 leading-tight block">
                      {p.title}
                    </Link>
                    <span className="text-[10px] text-gray-400 block">{p.seller}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-50 dark:border-brand-navy-light/5 pt-3">
                    <span className="font-extrabold text-sm text-brand-navy dark:text-brand-orange">
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-400 line-through">₹{p.originalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. RECOMMENDED PRODUCTS (AI CUSTOM FEED) */}
      <section className="py-14 bg-white dark:bg-brand-navy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-baseline mb-8">
            <h3 className="text-xl sm:text-2xl font-extrabold text-brand-navy dark:text-white border-l-4 border-brand-orange pl-3 flex items-center gap-1.5">
              <Sparkles size={18} className="text-brand-orange animate-pulse" />
              AI Personalized Feed
            </h3>
            <span className="text-[10px] text-gray-400 font-semibold dark:text-gray-500">Based on your activity</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {allProducts.slice(16, 20).map((p) => (
              <div
                key={p.id}
                className="group bg-white dark:bg-brand-navy rounded-2xl border border-gray-100 dark:border-brand-navy-light/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="aspect-square bg-gray-50 dark:bg-brand-navy-dark relative overflow-hidden">
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute top-3 left-3 bg-brand-orange/10 text-brand-orange text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Sparkles size={10} className="fill-brand-orange" />
                    AI Pick
                  </span>
                </div>
                <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <Link to={`/product/${p.id}`} className="font-bold text-gray-800 dark:text-gray-100 text-xs sm:text-sm hover:text-brand-orange line-clamp-2 leading-tight block">
                      {p.title}
                    </Link>
                    <span className="text-[10px] text-gray-400 block">{p.seller}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-50 dark:border-brand-navy-light/5 pt-3">
                    <span className="font-extrabold text-sm text-brand-navy dark:text-brand-orange">
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-400 line-through">₹{p.originalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CUSTOMER REVIEWS */}
      <section className="py-14 bg-gray-50/50 dark:bg-brand-navy/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white mb-2">
              Voice of the Community
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Read verified customer reviews from across the country</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Dr. Ramesh Nair', role: 'Buyer (Ayurveda)', text: 'KSM-66 Ashwagandha is absolutely genuine. I am experiencing massive improvements in stress levels and sleep quality.', rating: 5, location: 'Kochi, Kerala' },
              { name: 'Kavita Patel', role: 'Buyer (Fashion)', text: ' Kurta Fabric feels like authentic cotton. The embroidery work is top-tier. Very happy with the shipping updates.', rating: 5, location: 'Ahmedabad, Gujarat' },
              { name: 'Aakash Malhotra', role: 'Buyer (Electronics)', text: 'Ordered the TantraSound Pro ANC. Battery life is incredible. Recharged only once in 2 weeks! Delhivery AWB tracking was smooth.', rating: 4, location: 'Delhi NCR' }
            ].map((rev, idx) => (
              <div key={idx} className="bg-white dark:bg-brand-navy p-6 rounded-2xl border border-gray-100 dark:border-brand-navy-light/10 shadow-xs space-y-4">
                <div className="flex items-center gap-1.5">{ratingStars(rev.rating)}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                  "{rev.text}"
                </p>
                <div className="border-t border-gray-50 dark:border-brand-navy-light/5 pt-3 flex justify-between items-center text-[10.5px]">
                  <div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 block">{rev.name}</span>
                    <span className="text-gray-400">{rev.role}</span>
                  </div>
                  <span className="text-brand-orange font-bold">{rev.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. DOWNLOAD MOBILE APP SECTION */}
      <section className="py-14 bg-white dark:bg-brand-navy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-brand-navy to-brand-navy-light rounded-3xl text-white p-8 md:p-14 overflow-hidden relative shadow-xl">
            <div className="max-w-md space-y-5 z-10 relative">
              <span className="bg-brand-orange text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md">Unified App Ecosystem</span>
              <h3 className="text-2xl sm:text-4xl font-extrabold leading-tight">Take SHOPTANTRA with you everywhere</h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Download the customer shopping app or log in to the seller dashboard to manage listings. Fully compatible with Android & iOS.
              </p>
              
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/mobile-preview"
                  className="bg-brand-orange hover:bg-brand-orange-hover text-white font-bold py-2.5 px-5 rounded-lg text-xs flex items-center gap-1.5 shadow"
                >
                  <Smartphone size={16} />
                  Launch Interactive Simulator
                </Link>
              </div>
            </div>

            {/* Visual design element representing mobile apps */}
            <div className="absolute right-0 bottom-0 top-0 w-1/2 hidden md:flex items-end justify-center pointer-events-none opacity-20 lg:opacity-100">
              <div className="w-52 h-64 bg-white/10 border-4 border-white/20 rounded-t-3xl p-2.5 transform translate-y-8 translate-x-4 rotate-12 flex flex-col justify-between">
                <div className="w-20 h-3 bg-white/25 rounded-full mx-auto" />
                <div className="flex-grow bg-brand-navy rounded-xl mt-3 flex items-center justify-center font-bold text-xs text-white">Customer App</div>
              </div>
              <div className="w-52 h-72 bg-white/15 border-4 border-white/30 rounded-t-3xl p-2.5 transform translate-y-12 -translate-x-4 -rotate-6 flex flex-col justify-between">
                <div className="w-20 h-3 bg-white/25 rounded-full mx-auto" />
                <div className="flex-grow bg-brand-navy rounded-xl mt-3 flex items-center justify-center font-bold text-xs text-white">Seller App</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 11. NEWSLETTER SUBSCRIPTION (FOOTER INCLUDED, BUT ADD PROMO BLOCK HERE) */}
      <section className="py-12 bg-gray-50/50 dark:bg-brand-navy/10 border-t border-b border-gray-150/40 dark:border-brand-navy-light/10">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider block">First Purchase Discount</span>
          <h3 className="text-xl sm:text-2xl font-black text-brand-navy dark:text-white">Join the SHOPTANTRA Circle</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Subscribe below in our footer to receive a flat **20% OFF coupon** (`WELCOME`) automatically added to your notification drawer!
          </p>
        </div>
      </section>

      {/* 12. BLOG SECTION */}
      <section className="py-14 bg-white dark:bg-brand-navy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white mb-2">
              From the Tantra Blog
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Tips, trends, and success stories from the Indian market</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Indian Marketplace Revolution: Why Local Sellers Win", desc: "How direct-to-consumer models are helping small scale artisans compete globally with minimum fees.", date: "June 14, 2026", author: "Devang Vyas" },
              { title: "Choosing Gir Ghee: Churned Vedic Methods", desc: "Understanding the science and digestive health benefits behind hand churned Bilona A2 Desi Cow ghee.", date: "June 10, 2026", author: "Swati Iyer" },
              { title: "GaN Charging: The Future of Mobile Power Packs", desc: "Why Gallium Nitride (GaN) is replacing silicon in premium 65W laptop adapters and chargers.", date: "May 28, 2026", author: "Kabir Lal" }
            ].map((post, idx) => (
              <article key={idx} className="group bg-white dark:bg-brand-navy rounded-2xl border border-gray-100 dark:border-brand-navy-light/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full">
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-gray-450 font-bold">
                    <span>{post.date}</span>
                    <span>By {post.author}</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-gray-800 dark:text-gray-100 group-hover:text-brand-orange transition-colors leading-snug">
                    {post.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{post.desc}</p>
                </div>
                <div className="px-5 pb-5 pt-2 border-t border-gray-50 dark:border-brand-navy-light/5 text-right">
                  <span className="text-[10px] font-bold text-brand-orange flex items-center gap-1 justify-end group-hover:underline cursor-pointer">
                    Read Post
                    <ArrowRight size={10} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 13. FAQ SECTION ACCORDION */}
      <section className="py-14 bg-gray-50/50 dark:bg-brand-navy/10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Quick answers to common questions about buying and selling on our portal</p>
          </div>

          <div className="space-y-3">
            {[
              { q: "How are products verified on SHOPTANTRA?", a: "Every merchant/seller registers their business using government-verified details, including GSTIN and PAN cards. Our admin team conducts checks before store approvals to prevent fake listings." },
              { q: "What are the standard shipping carriers and charges?", a: "We integrate directly with Shiprocket, delivering packages via Delhivery, Blue Dart, and Express logistics. Shipping is flat ₹99 for orders under ₹999, and completely FREE for orders above ₹999." },
              { q: "Is cash on delivery (COD) supported?", a: "Yes, we support Cash on Delivery, alongside secure payment gateways like Razorpay, Cashfree, and UPI scan codes." },
              { q: "How can I register as a seller and what are the fees?", a: "Simply click the 'Become a Seller' button, complete the registration form with your GSTIN and bank details. We offer a transparent commission system starting at 5% dependent on categories." }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white dark:bg-brand-navy rounded-xl border border-gray-100 dark:border-brand-navy-light/10 shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-5 py-4 font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm flex justify-between items-center transition-colors hover:bg-gray-50 dark:hover:bg-brand-navy-light/10"
                >
                  {faq.q}
                  <ChevronDown size={16} className={`transform transition-transform text-gray-400 ${faqActive === idx ? 'rotate-180 text-brand-orange' : ''}`} />
                </button>
                {faqActive === idx && (
                  <div className="px-5 pb-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-brand-navy-light/5 pt-3.5">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 14. CONTACT SECTION */}
      <section className="py-14 bg-white dark:bg-brand-navy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-55/40 dark:bg-brand-navy rounded-3xl border border-gray-100 dark:border-brand-navy-light/10 p-6 sm:p-10 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* Form Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-brand-navy dark:text-white border-l-4 border-brand-orange pl-3">
                    Contact Our Support Team
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Have an issue with shipping or payment? Write to us.</p>
                </div>

                {contactSent && (
                  <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-xs font-semibold p-4 rounded-xl flex items-center gap-2">
                    <Check size={18} />
                    Message submitted successfully! We will get back to you shortly.
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-405 uppercase tracking-wide">Your Name</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Nilesh Kumar"
                        className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-405 uppercase tracking-wide">Email Address</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. buyer@example.com"
                        className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-405 uppercase tracking-wide">Your Message</label>
                    <textarea
                      rows={4}
                      required
                      value={contactMsg}
                      onChange={(e) => setContactMsg(e.target.value)}
                      placeholder="Write your support ticket descriptions here..."
                      className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-brand-navy hover:bg-brand-navy-light text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow"
                  >
                    Send Message
                    <Send size={14} />
                  </button>
                </form>
              </div>

              {/* Map/Contact info Column */}
              <div className="space-y-6 flex flex-col justify-between">
                <div className="space-y-4 text-xs">
                  <h4 className="font-bold text-gray-800 dark:text-gray-200">SHOPTANTRA Head Office</h4>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                    Connecting premium Indian products, direct from small-scale industries and local manufacturers. Verified under Tantra Group of Companies.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="text-brand-orange" size={16} />
                      <span className="text-gray-700 dark:text-gray-300">147, NAVA PARA BAPASITARAM MADHULI NEAR, BODIYA -382245</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="text-brand-orange" size={16} />
                      <span className="text-gray-700 dark:text-gray-300">+91 90999 85145 (Mon-Sat, 9AM-6PM)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="text-brand-orange" size={16} />
                      <span className="text-gray-700 dark:text-gray-300">support@shoptantra.in</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Google Map */}
                <div className="bg-gray-100 dark:bg-brand-navy-dark rounded-2xl h-44 border border-gray-150 dark:border-brand-navy-light/10 relative overflow-hidden flex items-center justify-center text-center">
                  <div className="space-y-1 z-10 p-4">
                    <span className="bg-brand-navy text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase">Live Location</span>
                    <h5 className="font-bold text-gray-800 dark:text-gray-200 text-xs">Bodiya, India</h5>
                    <span className="text-[9px] text-gray-400 block mt-0.5">Vedic tech campus and cargo dispatch center</span>
                  </div>
                  {/* Subtle map lines */}
                  <div className="absolute inset-0 opacity-15" style={{
                    backgroundImage: 'radial-gradient(#f76b00 1px, transparent 1px), linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }} />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
