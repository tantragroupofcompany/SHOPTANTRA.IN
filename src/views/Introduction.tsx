import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Award, ShieldCheck, Zap, Heart, Users, Compass, Target, 
  CheckCircle, ArrowRight, Mail, Phone, MapPin, Building, 
  Globe, TrendingUp, Cpu, Smile, ChevronRight, Linkedin, 
  Twitter, MessageSquare, Send, BookOpen, Rocket, Check
} from 'lucide-react';

export default function Introduction() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        // Wait slightly for DOM to settle
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    // Form validation
    if (!formData.name.trim()) {
      setFormError('Name is required.');
      setFormLoading(false);
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError('A valid email address is required.');
      setFormLoading(false);
      return;
    }
    if (!formData.subject.trim()) {
      setFormError('Subject is required.');
      setFormLoading(false);
      return;
    }
    if (!formData.message.trim()) {
      setFormError('Message is required.');
      setFormLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: `Subject: ${formData.subject}\n\n${formData.message}`,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to submit message.');
      }

      setFormSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setFormError(err.message || 'An error occurred. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Section 6: Leadership Team Data
  const leaders = [
    {
      id: 'founder',
      name: 'Jadav Nilesh',
      role: 'Founder & Visionary Leader',
      image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      bio: 'Jadav Nilesh is the Founder of SHOPTANTRA, a modern e-commerce and digital business platform built with the vision of transforming online commerce in India. His goal is to create a trusted ecosystem where customers, sellers, and businesses can connect, grow, and succeed through innovative technology solutions.',
      linkedin: '#',
      twitter: '#'
    },
    {
      id: 'md',
      name: 'Jadav Nayna',
      role: 'Managing Director (MD)',
      image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
      bio: 'Jadav Nayna serves as the Managing Director of SHOPTANTRA, overseeing business operations, organizational development, and strategic execution. She plays a vital role in ensuring operational efficiency, maintaining high service standards, and strengthening relationships with customers, partners, and sellers.',
      linkedin: '#',
      twitter: '#'
    },
    {
      id: 'ceo',
      name: 'Jadav Jayesh',
      role: 'Chief Executive Officer (CEO)',
      image: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg',
      bio: 'Jadav Jayesh serves as the Chief Executive Officer of SHOPTANTRA, leading the company\'s strategic growth, innovation initiatives, and business expansion plans. He is responsible for ensuring that SHOPTANTRA remains customer-focused while continuously adapting to the latest technological advancements and market trends.',
      linkedin: '#',
      twitter: '#'
    },
    {
      id: 'coo',
      name: 'Anjali Sharma',
      role: 'Chief Operating Officer (COO)',
      image: 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg',
      bio: 'Manages global vendor fulfillment, supply chain partnerships, logistics interfaces, and customer experience operations.',
      linkedin: '#',
      twitter: '#'
    },
    {
      id: 'cto',
      name: 'Rajesh K. Mehta',
      role: 'Chief Technology Officer (CTO)',
      image: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg',
      bio: 'Directs software engineering, infrastructure scaling, AI search recommendation nodes, and platform security systems.',
      linkedin: '#',
      twitter: '#'
    },
    {
      id: 'cmo',
      name: 'Priya Sen',
      role: 'Chief Marketing Officer (CMO)',
      image: 'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg',
      bio: 'Architects brand placement, seller acquisition programs, local SEO campaigns, and multi-channel buyer growth strategies.',
      linkedin: '#',
      twitter: '#'
    },
    {
      id: 'cfo',
      name: 'Vikram Aditya',
      role: 'Chief Financial Officer (CFO)',
      image: 'https://images.pexels.com/photos/927022/pexels-photo-927022.jpeg',
      bio: 'Controls capital allocation, platform commission economics, vendor settlement cycles, and tax structures.',
      linkedin: '#',
      twitter: '#'
    },
    {
      id: 'hrd',
      name: 'Meenakshi Iyer',
      role: 'HR Director',
      image: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg',
      bio: 'Cultivates high-performance engineering culture, vendor relationship training academies, and corporate development policies.',
      linkedin: '#',
      twitter: '#'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-navy-dark text-black dark:text-white transition-colors duration-300">
      
      {/* SECTION 1: HERO INTRODUCTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-navy-dark text-white py-24 sm:py-32">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-orange/10 rounded-full filter blur-3xl -translate-x-12 -translate-y-12"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl translate-x-12 translate-y-12"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/20 mb-8 shadow-2xl hover:scale-105 transition-transform duration-300">
              <img 
                src="/SHOPTANTRA.png" 
                alt="SHOPTANTRA Logo" 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="font-extrabold text-2xl tracking-tight text-white block">SHOPTANTRA</span>
            </div>

            <span className="bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-wider mb-4">
              Corporate Profile
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mt-2 mb-6">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-400">SHOPTANTRA</span>
            </h1>
            <p className="text-lg sm:text-2xl font-semibold text-gray-300 max-w-3xl mb-8 leading-normal">
              India's Next Generation E-Commerce & Business Marketplace
            </p>
            <div className="max-w-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-sm sm:text-base text-gray-300 leading-relaxed shadow-lg">
              SHOPTANTRA (<a href="https://shoptantra.in" className="text-brand-orange underline hover:text-orange-400">shoptantra.in</a>) is India's premier multi-vendor marketplace connecting authentic local brands and sellers with buyers nationwide. We combine localized commerce logistics, zero technical entry barriers, and cutting-edge security systems to revolutionize the digital trade ecosystem of India.
            </div>
            
            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <a 
                href="#about" 
                className="bg-brand-orange hover:bg-brand-orange-hover text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-brand-orange/20 flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                Explore Profile <ArrowRight size={18} />
              </a>
              <a 
                href="#contact" 
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                Contact Board
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ABOUT SHOPTANTRA */}
      <section id="about" className="py-20 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">About SHOPTANTRA</h2>
            <p className="mt-4 text-black dark:text-gray-300 font-medium">Our journey, objectives, and roadmap to transforming India's commerce.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Detailed Intro & Journey */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 p-8 rounded-3xl shadow-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-brand-orange">
                  <BookOpen size={20} /> Why SHOPTANTRA Was Created
                </h3>
                <p className="text-black dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                  India’s digital growth is booming, yet millions of small and medium businesses (MSMEs) face severe entry barriers: high commission rates, complex technical frameworks, and logistical issues. SHOPTANTRA was founded to break these barriers down. We offer a transparent, accessible, and high-performance marketplace enabling any merchant to digitize their operations instantly, reach active national audiences, and process secure payments at low margins.
                </p>
              </div>

              <div className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 p-8 rounded-3xl shadow-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-brand-orange">
                  <Rocket size={20} /> Company Journey
                </h3>
                <p className="text-black dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                  Starting as a vision to unite Swadeshi craftspeople and local distributors, SHOPTANTRA quickly grew into a technical hub. We built integrated payment models supporting automated Razorpay split payouts, live shipping aggregations with Delhivery and Blue Dart through Shiprocket, and detailed seller management panels. Today, we support thousands of active SKUs across categories like Grocery, Ayurveda, Electronics, and Local crafts.
                </p>
              </div>
            </div>

            {/* Core Values & Roadmap */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-gradient-to-br from-brand-navy to-brand-navy-dark text-white p-8 rounded-3xl shadow-xl border border-white/10 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5">
                  <Building size={200} />
                </div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-brand-orange">
                  <Target size={20} /> Business Objectives
                </h3>
                <ul className="space-y-4">
                  {[
                    "Zero upfront setup friction for micro-sellers.",
                    "End-to-end automated logistics from order to doorstep.",
                    "Direct payout cycles with split gateway options.",
                    "Sourcing authenticated products straight from local roots."
                  ].map((obj, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="bg-brand-orange/20 text-brand-orange p-1 rounded-lg shrink-0 mt-0.5">
                        <CheckCircle size={14} />
                      </span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 p-8 rounded-3xl shadow-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-brand-orange">
                  <TrendingUp size={20} /> Future Roadmap
                </h3>
                <div className="space-y-4 text-xs sm:text-sm text-black dark:text-gray-300 font-medium">
                  <div className="border-l-2 border-brand-orange pl-4 relative">
                    <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-orange"></span>
                    <strong className="block text-gray-900 dark:text-white">Phase 1: Local Onboarding</strong>
                    Expansion across district hubs, partnering directly with agricultural cooperatives and manufacturing units.
                  </div>
                  <div className="border-l-2 border-brand-orange pl-4 relative">
                    <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-orange"></span>
                    <strong className="block text-gray-900 dark:text-white">Phase 2: AI Enhancements</strong>
                    Dynamic recommendation nodes, automatic catalogs, and automated customer support integrations.
                  </div>
                  <div className="border-l-2 border-brand-orange pl-4 relative">
                    <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-orange"></span>
                    <strong className="block text-gray-900 dark:text-white">Phase 3: Hyperlocal Delivery</strong>
                    Extending sub-hour deliveries for groceries, daily essentials, and pharmacy products across major cities.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>      {/* SECTION 3: FOUNDER MESSAGE */}
      <section id="founder" className="py-20 bg-gray-100/50 dark:bg-brand-navy-dark/40 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 rounded-3xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              {/* Message Side (Full Width) */}
              <div className="lg:col-span-12 p-8 sm:p-12 flex flex-col justify-center space-y-6">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-gray-150/40 dark:border-brand-navy-light/10 pb-4">
                  <div className="flex items-center gap-2 text-brand-orange font-bold text-sm uppercase tracking-wider">
                    <Heart size={18} /> Founder Message
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Jadav Nilesh</h3>
                    <p className="text-xs text-brand-orange font-bold">Founder & Visionary Leader</p>
                  </div>
                </div>
                <div className="text-sm sm:text-base text-black dark:text-gray-300 space-y-4">
                  <p>
                    Jadav Nilesh is the Founder of SHOPTANTRA, a modern e-commerce and digital business platform built with the vision of transforming online commerce in India. His goal is to create a trusted ecosystem where customers, sellers, and businesses can connect, grow, and succeed through innovative technology solutions.
                  </p>
                  <p>
                    With a strong entrepreneurial mindset and passion for digital transformation, he established SHOPTANTRA to empower businesses of all sizes and provide customers with a seamless shopping experience. His vision continues to drive the company toward innovation, transparency, and long-term success.
                  </p>
                </div>
                <blockquote className="text-base sm:text-lg italic text-brand-orange font-semibold border-l-4 border-brand-orange pl-4 leading-relaxed">
                  "Every successful business starts with a vision. SHOPTANTRA was created to turn that vision into opportunities for everyone."
                </blockquote>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CEO MESSAGE */}
      <section id="ceo" className="py-20 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 rounded-3xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              {/* Message Side (Full Width) */}
              <div className="lg:col-span-12 p-8 sm:p-12 flex flex-col justify-center space-y-6">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-gray-150/40 dark:border-brand-navy-light/10 pb-4">
                  <div className="flex items-center gap-2 text-brand-orange font-bold text-sm uppercase tracking-wider">
                    <Zap size={18} /> CEO Message & Strategy
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Jadav Jayesh</h3>
                    <p className="text-xs text-brand-orange font-bold">Chief Executive Officer (CEO)</p>
                  </div>
                </div>
                <div className="text-sm sm:text-base text-black dark:text-gray-300 space-y-4">
                  <p>
                    Jadav Jayesh serves as the Chief Executive Officer of SHOPTANTRA, leading the company's strategic growth, innovation initiatives, and business expansion plans. He is responsible for ensuring that SHOPTANTRA remains customer-focused while continuously adapting to the latest technological advancements and market trends.
                  </p>
                  <p>
                    His leadership philosophy is centered around innovation, operational excellence, and delivering exceptional value to customers and sellers. Under his guidance, SHOPTANTRA aims to become one of India's most trusted and fastest-growing digital commerce platforms.
                  </p>
                </div>
                <blockquote className="text-base sm:text-lg italic text-brand-orange font-semibold border-l-4 border-brand-orange pl-4 leading-relaxed">
                  "Our mission is to create a platform where technology, trust, and customer satisfaction work together to drive sustainable growth."
                </blockquote>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: MANAGING DIRECTOR (MD) */}
      <section id="md" className="py-20 bg-gray-100/50 dark:bg-brand-navy-dark/40 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 rounded-3xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              {/* Message Side (Full Width) */}
              <div className="lg:col-span-12 p-8 sm:p-12 flex flex-col justify-center space-y-6">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-gray-150/40 dark:border-brand-navy-light/10 pb-4">
                  <div className="flex items-center gap-2 text-brand-orange font-bold text-sm uppercase tracking-wider">
                    <ShieldCheck size={18} /> Managing Director's Message
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Jadav Nayna</h3>
                    <p className="text-xs text-brand-orange font-bold">Managing Director (MD)</p>
                  </div>
                </div>
                <div className="text-sm sm:text-base text-black dark:text-gray-300 space-y-4">
                  <p>
                    Jadav Nayna serves as the Managing Director of SHOPTANTRA, overseeing business operations, organizational development, and strategic execution. She plays a vital role in ensuring operational efficiency, maintaining high service standards, and strengthening relationships with customers, partners, and sellers.
                  </p>
                  <p>
                    Her dedication to excellence, leadership, and innovation helps SHOPTANTRA maintain a strong foundation for long-term growth. She is committed to building a business environment that values trust, professionalism, and continuous improvement.
                  </p>
                </div>
                <blockquote className="text-base sm:text-lg italic text-brand-orange font-semibold border-l-4 border-brand-orange pl-4 leading-relaxed">
                  "Our focus is on creating meaningful experiences for customers while empowering businesses with the tools they need to succeed in the digital economy."
                </blockquote>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: LEADERSHIP TEAM */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">Meet Our Leadership Team</h2>
            <p className="mt-4 text-black dark:text-gray-300 font-medium">The experienced professionals guiding SHOPTANTRA’s technological and commercial growth.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {leaders.map((leader) => (
              <div 
                key={leader.id} 
                className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                {/* Image or 3D Initials Placeholder (removed founder, ceo, md images) */}
                {['founder', 'ceo', 'md'].includes(leader.id) ? (
                  <div className="h-52 bg-gradient-to-br from-brand-orange/15 to-brand-navy-light/15 flex flex-col items-center justify-center border-b border-gray-150/40 dark:border-brand-navy-light/10 p-6 relative overflow-hidden">
                    <div className="w-16 h-16 rounded-full bg-brand-orange text-white flex items-center justify-center text-xl font-black shadow-lg border-2 border-white dark:border-brand-navy depth-3d">
                      {leader.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-[10px] font-black uppercase text-brand-orange mt-3 tracking-wider">Verified Executive Board</span>
                  </div>
                ) : (
                  <div className="h-52 overflow-hidden relative bg-brand-navy">
                    <img 
                      src={leader.image} 
                      alt={leader.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                      {/* Socials */}
                      <div className="flex gap-3">
                        <a href={leader.linkedin} className="bg-brand-orange hover:bg-brand-orange-hover text-white p-2 rounded-lg transition-colors">
                          <Linkedin size={16} />
                        </a>
                        <a href={leader.twitter} className="bg-brand-orange hover:bg-brand-orange-hover text-white p-2 rounded-lg transition-colors">
                          <Twitter size={16} />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="p-6 space-y-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-brand-orange tracking-wider">{leader.role}</span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{leader.name}</h3>
                  </div>
                  <p className="text-xs text-black dark:text-gray-300 leading-relaxed line-clamp-3">
                    {leader.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: LEADERSHIP VISION */}
      <section className="py-20 bg-gradient-to-br from-brand-navy to-brand-navy-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/5 rounded-full filter blur-3xl -translate-y-12 translate-x-12"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="w-16 h-16 bg-brand-orange/20 text-brand-orange rounded-2xl flex items-center justify-center mb-6 mx-auto depth-3d">
              <Compass size={32} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Leadership Vision</h2>
            <p className="text-base sm:text-xl text-gray-300 leading-relaxed">
              Together, the leadership team of SHOPTANTRA is committed to building a future-ready platform that combines technology, trust, and innovation. Their shared vision is to empower businesses, support entrepreneurs, and provide customers with a secure and reliable digital marketplace experience across India and beyond.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 9: COMPANY VALUES */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">Our Core Values</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">The cultural principles that guide how we interact with buyers, merchants, and team members.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Trust", desc: "Building secure escrow models and maintaining honest shipping schedules.", icon: ShieldCheck },
              { title: "Innovation", desc: "Regularly integrating advanced search indexes, payout channels, and cloud engines.", icon: Zap },
              { title: "Transparency", desc: "Detailed vendor ledgers, zero hidden billing structures, and clear guidelines.", icon: BookOpen },
              { title: "Customer First", desc: "Prioritizing support requests and securing purchases with active refunds.", icon: Smile },
              { title: "Integrity", desc: "Honoring vendor payouts and maintaining solid seller code profiles.", icon: Award },
              { title: "Excellence", desc: "Refining platform processing speeds and delivery networks continuously.", icon: Heart }
            ].map((value, idx) => {
              const Icon = value.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 p-8 rounded-2xl shadow-xs hover:shadow-md hover:border-brand-orange/40 transition-all duration-300 group text-center flex flex-col items-center"
                >
                  <div className="w-12 h-12 bg-brand-orange/10 dark:bg-brand-orange/5 text-brand-orange rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{value.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 10: COMPANY ACHIEVEMENTS (STATISTICS) */}
      <section className="py-20 bg-brand-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-navy-light/10 via-brand-navy-dark to-brand-navy-dark"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 text-center">
            {[
              { count: "50,000+", label: "Registered Users", desc: "Buyers across India" },
              { count: "150,050+", label: "Products Listed", desc: "Verified SKUs active" },
              { count: "200,000+", label: "Orders Delivered", desc: "Fulfilled successfully" },
              { count: "5,005+", label: "Active Sellers", desc: "MSMEs and local shops" },
              { count: "98%", label: "Customer Satisfaction", desc: "Average review score" }
            ].map((stat, idx) => (
              <div key={idx} className="space-y-2 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5">
                <span className="block text-3xl sm:text-4xl font-black text-brand-orange">{stat.count}</span>
                <strong className="block text-xs sm:text-sm font-bold tracking-wide">{stat.label}</strong>
                <span className="block text-[10px] text-gray-400">{stat.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 11: WHY CHOOSE SHOPTANTRA */}
      <section className="py-20 bg-gray-150/20 dark:bg-brand-navy-dark/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">Why Choose SHOPTANTRA?</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">We prioritize merchant empowerment and secure customer satisfaction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Secure Platform", desc: "SSL secured checkouts, split payout nodes, and strict buyer purchase locks.", icon: ShieldCheck },
              { title: "Fast Delivery", desc: "Partnered directly with Shiprocket, Delhivery, and Blue Dart for prompt tracking.", icon: Rocket },
              { title: "Trusted Sellers", desc: "Every seller's GSTIN and store details are authenticated before catalogs go live.", icon: Award },
              { title: "Easy Returns", desc: "Direct ticket channels, dispute options, and instant buyer refund allocations.", icon: CheckCircle },
              { title: "Best Prices", desc: "Direct-from-manufacturer sourcing removes distributor markups completely.", icon: TrendingUp },
              { title: "Customer Support", desc: "24/7 support availability via email and live support chatbot modules.", icon: MessageSquare }
            ].map((reason, idx) => {
              const Icon = reason.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 p-8 rounded-2xl shadow-xs flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-brand-orange/10 text-brand-orange rounded-lg flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{reason.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{reason.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 12: FUTURE GOALS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">Our Future Goals</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Our roadmap to global expansion and advanced commerce technology.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Expansion Across India", desc: "Targeting complete onboarding coverage in over 1,000 smaller towns.", icon: Globe },
              { title: "AI Powered Marketplace", desc: "Intelligent matching engines to automatically forecast buyer requirements.", icon: Cpu },
              { title: "International Presence", desc: "Cross-border logistics channels letting Indian manufacturers export directly.", icon: Building },
              { title: "Digital Business Ecosystem", desc: "Integrated micro-credit facilities for verified merchant growth cycles.", icon: ShieldCheck }
            ].map((goal, idx) => {
              const Icon = goal.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-gradient-to-br from-brand-navy to-brand-navy-dark text-white p-8 rounded-2xl shadow-md border border-white/5 flex flex-col justify-between min-h-[220px]"
                >
                  <div className="w-10 h-10 bg-brand-orange/20 text-brand-orange rounded-lg flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <div className="space-y-2 mt-8">
                    <h3 className="text-base font-bold text-brand-orange">{goal.title}</h3>
                    <p className="text-xs text-gray-300 leading-relaxed">{goal.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 13: CONTACT LEADERSHIP */}
      <section id="contact" className="py-20 bg-gray-100/50 dark:bg-brand-navy-dark/40 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 rounded-3xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              {/* Contact Details Side */}
              <div className="lg:col-span-5 bg-gradient-to-br from-brand-navy to-brand-navy-light p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-orange/5 rounded-full filter blur-2xl translate-y-12 translate-x-12"></div>
                
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase text-brand-orange tracking-wider">Get In Touch</span>
                    <h3 className="text-3xl font-extrabold mt-1">Contact Leadership</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    Have questions about investment opportunities, merchant integration, or partnership structures? Contact our board directly.
                  </p>
                </div>

                <ul className="space-y-6 my-10">
                  <li className="flex items-center gap-4 text-xs sm:text-sm text-gray-200">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0 text-brand-orange">
                      <Mail size={18} />
                    </div>
                    <div>
                      <strong className="block text-[10px] text-gray-400 uppercase tracking-wide">Board Email</strong>
                      <a href="mailto:leadership@shoptantra.in" className="hover:text-brand-orange underline transition-colors">leadership@shoptantra.in</a>
                    </div>
                  </li>
                  <li className="flex items-center gap-4 text-xs sm:text-sm text-gray-200">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0 text-brand-orange">
                      <Phone size={18} />
                    </div>
                    <div>
                      <strong className="block text-[10px] text-gray-400 uppercase tracking-wide">Direct Line</strong>
                      <a href="tel:+919099985145" className="hover:text-brand-orange underline transition-colors">+91 90999 85145</a>
                    </div>
                  </li>
                  <li className="flex items-center gap-4 text-xs sm:text-sm text-gray-200">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0 text-brand-orange">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <strong className="block text-[10px] text-gray-400 uppercase tracking-wide">Corporate HQ</strong>
                      <span>147, NAVA PARA BAPASITARAM MADHULI NEAR, BODIYA -382245</span>
                    </div>
                  </li>
                </ul>

                <div className="text-[10px] text-gray-400 border-t border-white/10 pt-4">
                  SHOPTANTRA is a trade asset of TANTRA GROUP OF COMPANIES.
                </div>
              </div>

              {/* Form Side */}
              <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
                {formSubmitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={36} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Message Transmitted</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                      Your message has been securely sent directly to our executive board office. We will reply to your email within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-150/40 dark:border-brand-navy-light/10 pb-4">
                      Direct Communication Form
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-extrabold text-gray-800 dark:text-gray-300 uppercase tracking-wider">Your Name</label>
                        <input 
                          type="text" 
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-gray-50 dark:bg-brand-navy-light/10 text-black dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange border border-gray-200 dark:border-brand-navy-light/10 transition-all"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-extrabold text-gray-800 dark:text-gray-300 uppercase tracking-wider">Your Email</label>
                        <input 
                          type="email" 
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-gray-50 dark:bg-brand-navy-light/10 text-black dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange border border-gray-200 dark:border-brand-navy-light/10 transition-all"
                          placeholder="e.g. john@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold text-gray-800 dark:text-gray-300 uppercase tracking-wider">Subject</label>
                      <input 
                        type="text" 
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-gray-50 dark:bg-brand-navy-light/10 text-black dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange border border-gray-200 dark:border-brand-navy-light/10 transition-all"
                        placeholder="Inquiry Topic"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold text-gray-800 dark:text-gray-300 uppercase tracking-wider">Message Description</label>
                      <textarea 
                        rows={4}
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-gray-50 dark:bg-brand-navy-light/10 text-black dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange border border-gray-200 dark:border-brand-navy-light/10 transition-all resize-none"
                        placeholder="Write your corporate message here..."
                      ></textarea>
                    </div>

                    {formError && (
                      <div className="bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-red-400 text-xs p-3 rounded-lg border border-red-200 dark:border-red-900/30">
                        {formError}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={formLoading}
                      className="w-full bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                    >
                      {formLoading ? 'Transmitting...' : 'Transmit Message'} <Send size={15} />
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
