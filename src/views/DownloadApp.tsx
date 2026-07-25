import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Download, Smartphone, Shield, Zap, Clock, Package, Headphones, Gift, BarChart3, Users, Globe, QrCode, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Feature {
  icon: any;
  title: string;
  desc: string;
}

const features: Feature[] = [
  { icon: Shield, title: 'Secure Shopping', desc: 'End-to-end encrypted payments and data protection.' },
  { icon: Zap, title: 'Fast Checkout', desc: 'One-tap checkout with saved addresses and cards.' },
  { icon: Clock, title: 'Live Order Tracking', desc: 'Real-time updates from pickup to delivery.' },
  { icon: Gift, title: 'Exclusive Offers', desc: 'App-only deals, coupons, and cashback rewards.' },
  { icon: BarChart3, title: 'Seller Dashboard', desc: 'Manage products, orders, and analytics on the go.' },
  { icon: Users, title: 'Multi-Vendor Marketplace', desc: 'Shop from thousands of verified sellers in one app.' },
  { icon: Globe, title: 'Corporate Verified', desc: 'Only approved sellers with quality guarantee.' },
  { icon: Package, title: 'Easy Returns', desc: 'Hassle-free returns and refunds in 48 hours.' },
  { icon: Headphones, title: 'Customer Support', desc: '24x7 chat and call support for all queries.' },
];

const stats = [
  { label: 'Total Downloads', value: '500,000+' },
  { label: 'Current Version', value: '2.4.1' },
  { label: 'Last Updated', value: 'July 2026' },
];

export default function DownloadApp() {
  const navigate = useNavigate();
  const [qrSize, setQrSize] = useState(220);

  useEffect(() => {
    const handleResize = () => {
      setQrSize(window.innerWidth < 640 ? 180 : 220);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const qrData = typeof window !== 'undefined' ? `${window.location.origin}/download-app` : 'https://shoptantra.in/download-app';

  return (
    <>
      <Helmet>
        <title>Download SHOPTANTRA App | Shop Smarter, Sell Faster</title>
        <meta name="description" content="Download the official SHOPTANTRA app for Android. Shop smarter, sell faster, and manage your business from anywhere. Secure checkout, live tracking, exclusive offers." />
        <meta name="keywords" content="SHOPTANTRA app, download app, android app, online shopping, seller app, buyer app, marketplace India" />
        <link rel="canonical" href="https://shoptantra.in/download-app" />
        <meta property="og:title" content="Download SHOPTANTRA App | Shop Smarter, Sell Faster" />
        <meta property="og:description" content="Get the official SHOPTANTRA app. Secure shopping, live tracking, exclusive offers, and more." />
        <meta property="og:url" content="https://shoptantra.in/download-app" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Download SHOPTANTRA App" />
        <meta name="twitter:description" content="Shop smarter, sell faster with the official SHOPTANTRA mobile app." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-gray-900">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/SHOPTANTRA.png" alt="SHOPTANTRA" className="h-8 sm:h-10 object-contain" />
              <span className="font-bold text-base sm:text-lg">SHOPTANTRA</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <button onClick={() => navigate('/')} className="hover:text-brand-orange">Home</button>
              <button onClick={() => navigate('/products')} className="hover:text-brand-orange">Products</button>
              <button onClick={() => navigate('/seller')} className="hover:text-brand-orange">Seller</button>
              <button onClick={() => navigate('/corporate-access')} className="hover:text-brand-orange">Corporate</button>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy-light to-gray-900 opacity-95" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,165,0,0.15),transparent_40%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="text-white space-y-6">
                <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">Download the Official SHOPTANTRA App</h1>
                <p className="text-base sm:text-lg text-gray-200 max-w-xl">Shop smarter, sell faster and manage your business from anywhere.</p>
                <div className="flex flex-wrap gap-4">
                  <a href="/downloads/SHOPTANTRA.apk" download className="inline-flex items-center gap-2 bg-white text-brand-navy font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition shadow-lg">
                    <Download size={20} /> Download APK
                  </a>
                  <button disabled className="inline-flex items-center gap-2 bg-gray-700 text-white font-bold px-6 py-3 rounded-xl opacity-70 cursor-not-allowed">
                    <Smartphone size={20} /> Google Play (Coming Soon)
                  </button>
                  <button disabled className="inline-flex items-center gap-2 bg-gray-700 text-white font-bold px-6 py-3 rounded-xl opacity-70 cursor-not-allowed">
                    <Smartphone size={20} /> App Store (Coming Soon)
                  </button>
                </div>
              </div>
              <div className="flex justify-center">
                <img src="/SHOPTANTRA.png" alt="SHOPTANTRA App" className="h-40 sm:h-52 object-contain drop-shadow-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-4 sm:p-6">
            <div className="grid grid-cols-3 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xl sm:text-3xl font-extrabold text-brand-navy">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">App Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-3">
                  <f.icon size={20} />
                </div>
                <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* QR + Download */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-extrabold mb-3">Scan to Download</h2>
                <p className="text-sm text-gray-500 mb-4">Scan this QR code with your phone camera to open the download page directly.</p>
                <div className="space-y-2 text-xs text-gray-500">
                  <p><strong>Version:</strong> 2.4.1</p>
                  <p><strong>Release Date:</strong> July 2026</p>
                  <p><strong>App Size:</strong> ~24 MB</p>
                </div>
              </div>
              <div className="flex justify-center">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrData)}`} alt="Download QR Code" className="rounded-xl border border-gray-100 shadow-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* Marketing */}
        <section className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">Why Install SHOPTANTRA?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {['Faster Shopping', 'Exclusive Discounts', 'Secure Payments', 'Live Tracking', 'Instant Notifications', 'Better Performance', 'Multi-Vendor', 'Corporate Verified'].map((b) => (
                <div key={b} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100">
                  <ChevronRight size={18} className="text-brand-orange" />
                  <span className="text-sm font-semibold">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <img src="/SHOPTANTRA.png" alt="SHOPTANTRA" className="h-8 object-contain mb-4 brightness-0 invert" />
                <p className="text-xs text-gray-400">Shop smarter, sell faster with India's trusted multi-vendor marketplace.</p>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-3">Quick Links</h4>
                <ul className="space-y-2 text-xs">
                  <li><button onClick={() => navigate('/')} className="hover:text-white">Home</button></li>
                  <li><button onClick={() => navigate('/products')} className="hover:text-white">Products</button></li>
                  <li><button onClick={() => navigate('/seller')} className="hover:text-white">Seller Registration</button></li>
                  <li><button onClick={() => navigate('/corporate-access')} className="hover:text-white">Corporate Access</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-3">Downloads</h4>
                <ul className="space-y-2 text-xs">
                  <li><a href="/downloads/SHOPTANTRA.apk" download className="hover:text-white">Download APK</a></li>
                  <li><span className="text-gray-500">Google Play (Coming Soon)</span></li>
                  <li><span className="text-gray-500">App Store (Coming Soon)</span></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-3">Support</h4>
                <ul className="space-y-2 text-xs">
                  <li><button onClick={() => navigate('/contact')} className="hover:text-white">Contact Us</button></li>
                  <li><button onClick={() => navigate('/support')} className="hover:text-white">Help Center</button></li>
                  <li><button onClick={() => navigate('/refund-policy')} className="hover:text-white">Refund Policy</button></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500">
              © {new Date().getFullYear()} SHOPTANTRA. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}