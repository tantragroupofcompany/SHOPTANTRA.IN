import { Users, Target, Heart, Zap, TrendingUp, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  const stats = [
    { number: '12+', label: 'Categories Supported', icon: Globe },
    { number: '50K+', label: 'Verified Sellers', icon: Users },
    { number: '5M+', label: 'Happy Buyers', icon: TrendingUp },
    { number: '200+', label: 'Logistic Pin Codes', icon: Target },
  ];

  const values = [
    {
      icon: Heart,
      title: 'Customer Satisfaction First',
      description: 'We prioritize customer satisfaction and buyer protection systems in every decision we make.',
    },
    {
      icon: Target,
      title: 'Empowering Indian Sellers',
      description: 'We provide catalog tools, dashboard analytics, and direct payouts to help local businesses grow.',
    },
    {
      icon: Zap,
      title: 'Technological Innovation',
      description: 'We constantly innovate with AI search suggestions and voice commands to improve the shopping flow.',
    },
  ];

  const differences = [
    {
      title: 'Verified Swadeshi Merchants',
      description: 'All sellers register using government-verified details, including GSTIN and PAN cards.',
    },
    {
      title: 'Shiprocket Logistics API',
      description: 'Fast nationwide package delivery with transparent AWB tracking.',
    },
    {
      title: 'Razorpay Security Node',
      description: 'Encrypted bank-grade transactional nodes securing UPI, wallets, and card checkouts.',
    },
    {
      title: 'Ayurvedic & Swadeshi Focus',
      description: 'Direct visibility for authentic Indian heritage products, groceries, and herbal formulations.',
    },
  ];

  const team = [
    {
      name: 'Jadav Nilesh',
      title: 'Founder & Visionary',
      image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    },
    {
      name: 'Nayna Jadav',
      title: 'Managing Director (MD)',
      image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
    },
    {
      name: 'Jadav Jayesh',
      title: 'Chief Executive Officer (CEO)',
      image: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-brand-navy-dark transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-brand-navy via-brand-navy-light to-brand-navy text-white py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <span className="bg-brand-orange text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">Our Story</span>
          <h1 className="text-4xl sm:text-5xl font-black mt-4 mb-6">About SHOPTANTRA</h1>
          <p className="text-sm sm:text-base text-gray-200 leading-relaxed max-w-xl mx-auto">
            Empowering local sellers and delivering premium Swadeshi products across India.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-white dark:bg-brand-navy">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white border-l-4 border-brand-orange pl-3">
                Our Corporate Vision
              </h2>
              <p className="text-xs sm:text-sm text-black dark:text-gray-300 leading-relaxed">
                SHOPTANTRA (shoptantra.in) was founded with a clear directive: to make digital commerce accessible, fair, and highly profitable for Indian manufacturers and MSMEs. We bridge the gap between traditional craftmanship and modern consumers.
              </p>
              <p className="text-xs sm:text-sm text-black dark:text-gray-300 leading-relaxed">
                Our name represents the harmony between ancient strategic principles and modern tech nodes. We believe in empowering small businesses and providing consumers with an unparalleled selection of groceries, fashion, electronics, and ayurvedic formulations.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-brand-navy-light/10">
              <img
                src="https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg"
                alt="Our Story"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50/50 dark:bg-brand-navy-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-brand-navy dark:text-white mb-12">
            Trusted by Millions Nationwide
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-white dark:bg-brand-navy rounded-2xl p-6 text-center border border-gray-150/40 dark:border-brand-navy-light/10 shadow-xs">
                  <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-5 h-5 text-brand-orange" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-brand-navy dark:text-brand-orange mb-1">{stat.number}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-16 bg-white dark:bg-brand-navy">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-brand-navy dark:text-white mb-12">
            Our Core Pillars
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((value, idx) => {
              const Icon = value.icon;
              return (
                <div key={idx} className="bg-gray-50/50 dark:bg-brand-navy-dark p-6 rounded-2xl border border-gray-100 dark:border-brand-navy-light/10 shadow-xs space-y-4">
                  <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-orange" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">{value.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why We're Different */}
      <section className="py-16 bg-gray-50/50 dark:bg-brand-navy-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-brand-navy dark:text-white mb-12">
            Why Choose SHOPTANTRA?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {differences.map((diff, idx) => (
              <div key={idx} className="flex gap-4 p-5 bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 rounded-2xl shadow-xs">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 bg-brand-orange text-white rounded-lg flex items-center justify-center font-bold">
                    ✓
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">{diff.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">{diff.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-16 bg-white dark:bg-brand-navy">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-brand-navy dark:text-white mb-12">
            Leadership Team
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map((member, idx) => (
              <div key={idx} className="bg-gray-50/50 dark:bg-brand-navy-dark rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 dark:border-brand-navy-light/10 transition-shadow">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-56 object-cover"
                />
                <div className="p-5 text-center">
                  <h3 className="text-base font-bold text-gray-800 dark:text-white">{member.name}</h3>
                  <p className="text-brand-orange text-xs font-bold mt-1">{member.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-brand-navy to-brand-navy-light text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl font-black">Ready to Grow with SHOPTANTRA?</h2>
          <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
            Whether you are an authentic manufacturer looking to scale or a buyer seeking original Swadeshi products, we are here for you.
          </p>
          <div className="flex gap-4 justify-center flex-wrap pt-2">
            <Link
              to="/register/seller"
              className="bg-brand-orange hover:bg-brand-orange-hover text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md text-xs"
            >
              Become a Partner Seller
            </Link>
            <Link
              to="/products"
              className="border border-white/30 text-white hover:bg-white/10 font-bold py-3 px-8 rounded-xl transition-colors text-xs"
            >
              Start Shopping Catalog
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
