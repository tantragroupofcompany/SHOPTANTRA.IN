import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Globe,
  Package,
  Mic,
  Sun,
  Moon,
  Store,
  Check,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { mockProducts, CATEGORIES_LIST } from '../data/products';

export function Navbar() {
  const navigate = useNavigate();
  const { user, profile, signOut, setProfile } = useAuth();
  const {
    cart,
    wishlist,
    notifications,
    theme,
    toggleTheme,
    language,
    setLanguage,
    markNotificationsAsRead
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<typeof mockProducts>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim().length > 1) {
      const filtered = mockProducts.filter((product) =>
        product.title.toLowerCase().includes(value.toLowerCase()) ||
        product.category.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (title: string) => {
    setSearchQuery(title);
    navigate(`/products?search=${encodeURIComponent(title)}`);
    setShowSuggestions(false);
  };

  // Mock Voice Search
  const triggerVoiceSearch = () => {
    setIsListening(true);
    // Simulate speech recognition
    setTimeout(() => {
      const speechResults = ['Wireless ANC Headphones', 'Kurta Set', 'Pure Ghee', 'STEM Robotics'];
      const randomQuery = speechResults[Math.floor(Math.random() * speechResults.length)];
      setSearchQuery(randomQuery);
      setIsListening(false);
      navigate(`/products?search=${encodeURIComponent(randomQuery)}`);
    }, 2500);
  };

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    navigate('/');
  };

  const getDashboardLink = () => {
    if (profile?.role === 'admin') return '/admin';
    if (profile?.role === 'seller') return '/seller';
    return '/buyer';
  };

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const unreadNotifCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-brand-navy-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-brand-navy-light/20 shadow-sm transition-colors duration-300">
      
      {/* Top micro-bar */}
      <div className="w-full bg-gradient-to-r from-brand-navy to-brand-navy-light text-white text-xs py-2 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-gray-300">Welcome to India's Premium Marketplace</span>
          <Link to="/products?category=Grocery" className="text-brand-orange hover:underline font-semibold">
            🌾 Organic Pampore Kesar Flat 50% Off!
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/buyer/orders" className="hover:text-brand-orange transition-colors flex items-center gap-1">
            <Package size={12} />
            Track Order
          </Link>
          
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="hover:text-brand-orange transition-colors flex items-center gap-1 font-medium"
            >
              <Globe size={12} />
              {language === 'EN' ? 'English' : 'हिंदी'}
              <ChevronDown size={10} />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-28 bg-white dark:bg-brand-navy text-gray-800 dark:text-gray-200 rounded-lg shadow-lg border border-gray-100 dark:border-brand-navy-light/20 z-20 py-1">
                  <button
                    onClick={() => { setLanguage('EN'); setLangOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-brand-navy-light flex items-center justify-between"
                  >
                    English
                    {language === 'EN' && <Check size={12} className="text-brand-orange" />}
                  </button>
                  <button
                    onClick={() => { setLanguage('HI'); setLangOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-brand-navy-light flex items-center justify-between"
                  >
                    हिंदी
                    {language === 'HI' && <Check size={12} className="text-brand-orange" />}
                  </button>
                </div>
              </>
            )}
          </div>

          <Link
            to="/register/seller"
            className="hidden md:flex items-center gap-1 bg-brand-orange text-white hover:bg-brand-orange-hover font-semibold px-2 py-0.5 rounded transition-colors"
          >
            <Store size={12} />
            Become a Seller
          </Link>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            <img src="/SHOPTANTRA.png" alt="SHOPTANTRA" className="h-9 w-auto object-contain max-w-[130px] xs:max-w-[160px] sm:max-w-none sm:h-12 max-h-12" />
          </Link>

          {/* Categories Dropdown & AI Smart Search Bar */}
          <div className="hidden md:flex flex-grow max-w-2xl items-center gap-2">
            
            {/* Categories Menu */}
            <div className="relative">
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center gap-1.5 bg-gray-100 dark:bg-brand-navy-light/30 hover:bg-gray-200 dark:hover:bg-brand-navy-light/50 text-gray-800 dark:text-gray-200 px-4 py-2.5 rounded-l-lg text-sm font-semibold border-r border-gray-200 dark:border-brand-navy-light/10 transition-colors"
              >
                Categories
                <ChevronDown size={14} className={`transform transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
              </button>
              {categoriesOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCategoriesOpen(false)} />
                  <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-brand-navy rounded-xl shadow-xl border border-gray-100 dark:border-brand-navy-light/20 z-20 py-2 max-h-96 overflow-y-auto">
                    <div className="px-3 py-1 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Top Categories</div>
                    {CATEGORIES_LIST.map((cat) => (
                      <Link
                        key={cat}
                        to={`/products?category=${encodeURIComponent(cat)}`}
                        onClick={() => setCategoriesOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-brand-orange/10 hover:text-brand-orange dark:hover:bg-brand-navy-light transition-colors"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Live Suggest Search Form */}
            <div ref={searchRef} className="relative flex-grow">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="AI Smart Search: search products, brands, or categories..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.trim().length > 1 && setShowSuggestions(true)}
                  className="w-full bg-gray-100 dark:bg-brand-navy-light/30 text-gray-800 dark:text-gray-200 pl-4 pr-20 py-2.5 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50 dark:focus:ring-brand-orange/30 border-0 transition-all"
                />
                
                {/* Voice Search Icon */}
                <button
                  type="button"
                  onClick={triggerVoiceSearch}
                  className={`absolute right-12 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-brand-navy-light/50 transition-colors ${isListening ? 'text-brand-orange animate-pulse' : 'text-gray-400 dark:text-gray-500'}`}
                  title="Voice Search"
                >
                  <Mic size={16} />
                </button>

                {/* Search submit button */}
                <button
                  type="submit"
                  className="absolute right-2 p-1.5 rounded-md bg-brand-orange text-white hover:bg-brand-orange-hover transition-colors"
                >
                  <Search size={16} />
                </button>
              </form>

              {/* Suggestions Panel */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-brand-navy rounded-xl shadow-xl border border-gray-100 dark:border-brand-navy-light/20 z-20 py-2">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectSuggestion(item.title)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-brand-navy-light text-sm text-gray-700 dark:text-gray-200 flex items-center gap-3 transition-colors"
                    >
                      <img src={item.images[0]} alt={item.title} className="w-8 h-8 rounded object-cover" />
                      <div className="flex-grow">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{item.category} • {item.seller}</div>
                      </div>
                      <div className="font-semibold text-brand-navy dark:text-brand-orange">₹{item.price}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Controls: Theme, Notification, Wishlist, Cart, Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex p-2.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-navy-light/30 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification Center */}
            <div className="relative hidden md:block">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (!notifOpen) markNotificationsAsRead();
                }}
                className="p-2.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-navy-light/30 relative transition-colors"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 bg-brand-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-brand-navy rounded-xl shadow-xl border border-gray-100 dark:border-brand-navy-light/20 z-20 py-2 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-brand-navy-light/10 flex justify-between items-center">
                      <span className="font-bold text-gray-800 dark:text-gray-200">Notifications</span>
                      <span className="text-xs text-brand-orange font-semibold cursor-pointer" onClick={() => markNotificationsAsRead()}>Mark all read</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">No new alerts</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`px-4 py-3 border-b border-gray-50 dark:border-brand-navy-light/5 hover:bg-gray-50 dark:hover:bg-brand-navy-light/30 transition-colors ${!n.read ? 'bg-orange-50/50 dark:bg-brand-navy-light/10' : ''}`}>
                          <div className="font-semibold text-xs text-gray-800 dark:text-gray-200 flex justify-between items-center">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">{n.time}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Wishlist Link */}
            <Link
              to="/buyer/wishlist"
              className="hidden md:flex p-2.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-navy-light/30 relative transition-colors"
              title="Wishlist"
            >
              <Heart size={18} />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 bg-brand-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Link */}
            <Link
              to="/cart"
              className="p-2.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-navy-light/30 relative transition-colors"
              title="Cart"
            >
              <ShoppingCart size={18} />
              {cartItemsCount > 0 && (
                <span className="absolute top-1 right-1 bg-brand-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Profile / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-brand-navy-light/30 transition-colors"
                >
                  <div className="w-8 h-8 bg-brand-orange/15 rounded-full flex items-center justify-center border border-brand-orange/20">
                    <User className="w-4.5 h-4.5 text-brand-orange" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden lg:block">
                    {profile?.full_name?.split(' ')[0] ?? 'Account'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-brand-navy rounded-xl shadow-xl border border-gray-100 dark:border-brand-navy-light/20 z-20 py-1.5">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-brand-navy-light/10">
                        <div className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">{profile?.full_name}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</div>
                        <div className="mt-1 inline-block bg-brand-orange/10 text-brand-orange text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded">
                          {profile?.role}
                        </div>
                      </div>
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                        Dashboard
                      </Link>
                      {profile?.has_seller_profile && (
                        <button
                          onClick={() => {
                            const newRole = profile.role === 'seller' ? 'buyer' : 'seller';
                            setProfile({ ...profile, role: newRole });
                            localStorage.setItem('st_last_selected_role', newRole);
                            setUserMenuOpen(false);
                            navigate(newRole === 'seller' ? '/seller' : '/buyer');
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-brand-orange hover:bg-orange-50 dark:hover:bg-brand-navy-light transition-colors border-t border-b border-gray-100 dark:border-brand-navy-light/10 text-left font-semibold"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Switch to {profile.role === 'seller' ? 'Buyer' : 'Seller'}
                        </button>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-brand-orange dark:hover:text-brand-orange transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4.5 py-2.5 text-sm font-bold bg-brand-orange text-white rounded-lg hover:bg-brand-orange-hover transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-navy-light/30 transition-colors"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-header navigation for Desktop */}
      <div className="hidden md:block bg-gray-50 dark:bg-brand-navy border-t border-gray-100 dark:border-brand-navy-light/10 py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <nav className="flex items-center gap-8">
            <Link to="/" className="text-sm font-bold text-gray-700 dark:text-gray-255 hover:text-brand-orange transition-colors">Home</Link>
            
            {/* Categories link (inline dropdown) */}
            <div className="relative group">
              <Link to="/categories" className="text-sm font-bold text-gray-700 dark:text-gray-255 hover:text-brand-orange transition-colors flex items-center gap-1 cursor-pointer">
                Categories <ChevronDown size={12} />
              </Link>
              <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-brand-navy rounded-xl shadow-xl border border-gray-100 dark:border-brand-navy-light/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2 max-h-96 overflow-y-auto">
                {CATEGORIES_LIST.map((cat) => (
                  <Link
                    key={cat}
                    to={`/products?category=${encodeURIComponent(cat)}`}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-brand-orange/10 hover:text-brand-orange dark:hover:bg-brand-navy-light transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/products" className="text-sm font-bold text-gray-700 dark:text-gray-255 hover:text-brand-orange transition-colors">Products</Link>
            <Link to="/sellers" className="text-sm font-bold text-gray-700 dark:text-gray-255 hover:text-brand-orange transition-colors">Sellers</Link>
            <Link to="/deals" className="text-sm font-bold text-gray-700 dark:text-gray-255 hover:text-brand-orange transition-colors">Deals</Link>
            <Link to="/blog" className="text-sm font-bold text-gray-700 dark:text-gray-255 hover:text-brand-orange transition-colors">Blog</Link>
            <Link to="/contact" className="text-sm font-bold text-gray-700 dark:text-gray-255 hover:text-brand-orange transition-colors">Contact</Link>
            <Link to="/about" className="text-sm font-bold text-gray-700 dark:text-gray-255 hover:text-brand-orange transition-colors">About</Link>
          </nav>
          
        </div>
      </div>

      {/* Voice Search Listening Modal Overlay */}
      {isListening && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-brand-navy p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl border border-gray-100 dark:border-brand-navy-light/10">
            <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center bg-brand-orange/10 rounded-full">
              <Mic size={36} className="text-brand-orange animate-bounce" />
              <span className="absolute inset-0 rounded-full border-2 border-brand-orange/40 animate-ping" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Listening to your voice...</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Try saying "Wireless ANC Headphones" or "Ashwagandha"</p>
          </div>
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-brand-navy-light/10 bg-white dark:bg-brand-navy-dark px-4 py-4 space-y-3 transition-colors duration-300">
          
          {/* Mobile search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 dark:bg-brand-navy-light/20 text-gray-800 dark:text-gray-200 pl-4 pr-10 py-2 rounded-lg text-sm"
            />
            <button type="submit" className="absolute right-3 text-gray-400">
              <Search size={16} />
            </button>
          </form>

          <div className="space-y-1">
            {/* Theme Toggle (Mobile Drawer) */}
            <div
              onClick={() => { toggleTheme(); setMenuOpen(false); }}
              className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light rounded-lg cursor-pointer transition-colors"
            >
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              {theme === 'dark' ? <Sun size={16} className="text-brand-orange" /> : <Moon size={16} className="text-gray-400" />}
            </div>

            {/* Notifications (Mobile Drawer) */}
            <Link
              to="/buyer/notifications"
              className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light rounded-lg transition-colors"
              onClick={() => { setMenuOpen(false); markNotificationsAsRead(); }}
            >
              <span>Notifications</span>
              {unreadNotifCount > 0 && (
                <span className="bg-brand-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadNotifCount}
                </span>
              )}
            </Link>

            <Link to="/" className="block px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light rounded-lg" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/categories" className="block px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light rounded-lg" onClick={() => setMenuOpen(false)}>Categories</Link>
            <Link to="/products" className="block px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light rounded-lg" onClick={() => setMenuOpen(false)}>Products</Link>
            <Link to="/sellers" className="block px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light rounded-lg" onClick={() => setMenuOpen(false)}>Sellers</Link>
            <Link to="/deals" className="block px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light rounded-lg" onClick={() => setMenuOpen(false)}>Deals</Link>
            <Link to="/blog" className="block px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light rounded-lg" onClick={() => setMenuOpen(false)}>Blog</Link>
            <Link to="/contact" className="block px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light rounded-lg" onClick={() => setMenuOpen(false)}>Contact</Link>
            <Link to="/about" className="block px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light rounded-lg" onClick={() => setMenuOpen(false)}>About</Link>
            <Link to="/buyer/wishlist" className="block px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light rounded-lg flex justify-between items-center" onClick={() => setMenuOpen(false)}>
              <span>Wishlist</span>
              {wishlist.length > 0 && <span className="bg-brand-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{wishlist.length}</span>}
            </Link>
            <Link to="/cart" className="block px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light rounded-lg flex justify-between items-center" onClick={() => setMenuOpen(false)}>
              <span>Cart</span>
              {cartItemsCount > 0 && <span className="bg-brand-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{cartItemsCount}</span>}
            </Link>
            {user ? (
              <>
                <Link to={getDashboardLink()} className="block px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light rounded-lg" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <button onClick={() => { handleSignOut(); setMenuOpen(false); }} className="w-full text-left block px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light rounded-lg" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="block px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-navy-light rounded-lg" onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
