import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Send,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Footer() {
  const { addNotification } = useApp();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribeError(null);
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) return;

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setSubscribeError('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to subscribe.');
      }

      setSubscribed(true);
      setEmail('');
      addNotification(
        'Newsletter Subscribed',
        `Successfully subscribed ${trimmedEmail} to our newsletter list!`,
        'success'
      );
    } catch (err: any) {
      console.error('Newsletter subscription failed:', err);
      setSubscribeError(err.message || 'Failed to subscribe. Please try again later.');
    }
  };

  return (
    <footer className="bg-brand-navy text-white dark:bg-brand-navy-dark border-t border-brand-navy-light/10 transition-colors duration-300">
      
      {/* Newsletter Section */}
      <div className="border-b border-white/10 dark:border-brand-navy-light/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-md">
            <h4 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Mail className="text-brand-orange" />
              Subscribe to our Newsletter
            </h4>
            <p className="text-gray-300 text-sm">
              Get weekly updates on hot deals, new arrivals, and seller insights. No spam, we promise.
            </p>
          </div>
          <div className="w-full md:w-auto max-w-md flex flex-col gap-2 flex-grow">
            <form onSubmit={handleSubscribe} className="w-full flex gap-2">
              <input
                type="email"
                placeholder="Enter your email address..."
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (subscribeError) setSubscribeError(null);
                }}
                required
                className="flex-grow bg-white/10 dark:bg-brand-navy-light/20 border border-white/20 dark:border-brand-navy-light/30 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
              />
              <button
                type="submit"
                disabled={subscribed}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60"
              >
                {subscribed ? 'Subscribed!' : 'Subscribe'}
                <Send size={14} />
              </button>
            </form>
            {subscribeError && (
              <p className="text-red-400 text-xs mt-1" role="alert">{subscribeError}</p>
            )}
            {subscribed && (
              <p className="text-green-400 text-xs mt-1">Successfully subscribed! Thank you.</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          
          {/* Brand Info & Socials */}
          <div className="space-y-4">
            <img src="/SHOPTANTRA.png" alt="SHOPTANTRA" className="h-10 sm:h-12 w-auto" />
            <p className="text-gray-300 text-sm leading-relaxed">
              SHOPTANTRA (shoptantra.in) is India's premium multi-vendor marketplace, connecting authentic local brands and sellers with buyers nationwide. 
            </p>
            <div className="flex gap-3 pt-2">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 bg-white/15 dark:bg-brand-navy-light/30 rounded-lg flex items-center justify-center hover:bg-brand-orange hover:scale-105 hover:-translate-y-0.5 transition-all text-white"
                >
                  <Icon className="w-4.5 h-4.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Introduction Section */}
          <div>
            <h4 className="font-bold text-white mb-5 uppercase tracking-wider text-xs border-l-2 border-brand-orange pl-2">
              Introduction
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Founder (Jadav Nilesh)', to: '/introduction#founder' },
                { label: 'Managing Director (Nayna Jadav)', to: '/introduction#md' },
                { label: 'CEO (Jadav Jayesh)', to: '/introduction#ceo' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link to={link.to} className="text-gray-300 hover:text-brand-orange transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-bold text-white mb-5 uppercase tracking-wider text-xs border-l-2 border-brand-orange pl-2">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'About Us', to: '/about' },
                { label: 'Blog & Articles', to: '/blog' },
                { label: 'Careers & Team', to: '/careers' },
                { label: 'Store Directory', to: '/sellers' },
                { label: 'Contact Us', to: '/contact' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link to={link.to} className="text-gray-300 hover:text-brand-orange transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy Links */}
          <div>
            <h4 className="font-bold text-white mb-5 uppercase tracking-wider text-xs border-l-2 border-brand-orange pl-2">
              Policies & Help
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Privacy Policy', to: '/privacy' },
                { label: 'Terms & Conditions', to: '/terms' },
                { label: 'Return & Refund Policy', to: '/refund-policy' },
                { label: 'Seller Policy & Fees', to: '/seller-policy' },
                { label: 'Shipping & Delivery Policy', to: '/shipping-policy' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link to={link.to} className="text-gray-300 hover:text-brand-orange transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-bold text-white mb-5 uppercase tracking-wider text-xs border-l-2 border-brand-orange pl-2">
              Marketplace Office
            </h4>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-orange mt-0.5 shrink-0" />
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=147,+NAVA+PARA+BAPASITARAM+MADHULI+NEAR,+BODIYA+-382245" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-300 leading-snug hover:text-brand-orange transition-colors hover:underline"
                >
                  147, NAVA PARA BAPASITARAM MADHULI NEAR, BODIYA -382245
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-brand-orange shrink-0" />
                <a 
                  href="tel:+919099985145" 
                  className="text-gray-300 hover:text-brand-orange transition-colors hover:underline"
                >
                  +91 90999 85145
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-brand-orange shrink-0" />
                <a 
                  href="mailto:support@shoptantra.in" 
                  className="text-gray-300 hover:text-brand-orange transition-colors hover:underline"
                >
                  support@shoptantra.in
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer base */}
      <div className="border-t border-white/10 dark:border-brand-navy-light/10 bg-brand-navy-dark/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/tantra-group-logo.jpg" alt="Tantra Group Logo" className="h-8 w-auto object-contain rounded" />
            <p className="text-gray-450 dark:text-gray-400 text-sm font-bold tracking-wide">
              TANTRA GROUP
            </p>
          </div>
          
          {/* Payment & Security badges */}
          <div className="flex items-center gap-4 text-gray-400 text-xs">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-brand-orange" />
              SSL Secured Payments
            </span>
            <div className="flex gap-2">
              <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-gray-300">UPI</span>
              <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-gray-300">Razorpay</span>
              <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-gray-300">Cashfree</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
