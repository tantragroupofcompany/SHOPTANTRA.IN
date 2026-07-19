import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, ShieldCheck, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Contact() {
  const { addNotification } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Headquarters Office',
      content: '147, NAVA PARA BAPASITARAM MADHULI NEAR, BODIYA -382245',
    },
    {
      icon: Phone,
      title: 'Partner Helpline',
      content: '+91 9099989426',
    },
    {
      icon: Mail,
      title: 'Email Address',
      content: 'support@shoptantra.in',
    },
    {
      icon: Clock,
      title: 'Working Hours',
      content: 'Mon - Sat: 9:00 AM - 6:00 PM IST',
    },
  ];

  const subjectOptions = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'seller', label: 'Seller Registration Support' },
    { value: 'buyer', label: 'Order Tracking & Delivery' },
    { value: 'payment', label: 'Refunds & Payment Gateways' },
    { value: 'feedback', label: 'Customer Feedback' }
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Frontend validations
    if (!formData.name.trim()) {
      setError('Name is required.');
      setLoading(false);
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    if (formData.phone && formData.phone.trim().length > 20) {
      setError('Phone number is too long.');
      setLoading(false);
      return;
    }
    if (!formData.message.trim()) {
      setError('Message is required.');
      setLoading(false);
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
          phone: formData.phone,
          message: formData.message,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to submit inquiry.');
      }

      setSubmitted(true);
      addNotification(
        'Support Ticket Opened',
        `Thanks ${formData.name}! Support query submitted regarding ${formData.subject}.`,
        'system'
      );
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'general',
        message: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
      addNotification('Submission Failed', err.message || 'Failed to send inquiry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-brand-navy-dark transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-brand-navy via-brand-navy-light to-brand-navy text-white py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <span className="bg-brand-orange text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">Helpdesk Support</span>
          <h1 className="text-4xl sm:text-5xl font-black mt-4 mb-6">Get in Touch</h1>
          <p className="text-sm sm:text-base text-gray-200 leading-relaxed max-w-xl mx-auto">
            Have questions about ordering, logistics, or registration fees? We are here to help.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {contactInfo.map((info, idx) => {
            const Icon = info.icon;
            return (
              <div key={idx} className="bg-white dark:bg-brand-navy rounded-2xl p-6 shadow-xs text-center border border-gray-150/40 dark:border-brand-navy-light/10">
                <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-5 h-5 text-brand-orange" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{info.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed break-words">{info.content}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Form & Map Section */}
      <section className="py-12 bg-white dark:bg-brand-navy max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 rounded-3xl border border-gray-100 dark:border-brand-navy-light/10 shadow-sm mb-16">
        <div className="grid md:grid-cols-2 gap-12">
          
          {/* Contact Form */}
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-brand-navy dark:text-white border-l-4 border-brand-orange pl-3">
              Send us a Message
            </h2>

            {submitted ? (
              <div className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-2xl p-6 border border-green-150 dark:border-green-900/30 space-y-3">
                <CheckCircle className="w-10 h-10 text-green-650 mx-auto animate-bounce" />
                <h3 className="text-base font-bold text-center">
                  Support Ticket Submitted!
                </h3>
                <p className="text-xs text-center leading-normal">
                  Thank you for reaching out. A verified cargo manager will email you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-450 uppercase">Full Name *</label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Nilesh Kumar"
                    className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-450 uppercase">Email Address *</label>
                    <input
                      type="email"
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-450 uppercase">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                  placeholder="+91 9099989426"
                      className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-450 uppercase">Subject *</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  >
                    {subjectOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-455 uppercase">Describe your Issue *</label>
                  <textarea
                    rows={4}
                    required
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Write detailed query descriptions here..."
                    className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-red-400 text-xs p-3 rounded-lg border border-red-200 dark:border-red-900/30">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow"
                >
                  {loading ? 'Submitting...' : 'Submit Support Ticket'}
                  <Send size={13} />
                </button>
              </form>
            )}
          </div>

          {/* Map & Office Address */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-4 text-xs">
              <h4 className="font-extrabold text-gray-800 dark:text-gray-200">Registered Office</h4>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                SHOPTANTRA is a registered marketplace entity under TANTRA GROUP OF COMPANIES. Business queries can be addressed directly to Bodiya cargo terminal center.
              </p>
              
              <div className="bg-gray-50 dark:bg-brand-navy-dark/40 p-4 rounded-xl border border-gray-100 dark:border-brand-navy-light/5 text-xs space-y-2 font-semibold text-gray-600 dark:text-gray-400">
                <p>Company: TANTRA GROUP OF COMPANIES</p>
                <p>CIN Number: U72900UP2026PTC01845</p>
                <p>Support Helpline: support@shoptantra.in</p>
              </div>
            </div>

            {/* Google map simulation */}
            <div className="bg-gray-50 dark:bg-brand-navy-dark/60 rounded-2xl h-56 border border-gray-150 dark:border-brand-navy-light/10 relative overflow-hidden flex items-center justify-center text-center">
              <div className="space-y-1 z-10 p-4">
                <span className="bg-brand-navy text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase">Vedic Tech Campus</span>
                <h5 className="font-bold text-gray-800 dark:text-gray-200 text-xs">Bodiya, India</h5>
                <span className="text-[9px] text-gray-400 block mt-0.5">Automated sorting belts and logistics hubs</span>
              </div>
              <div className="absolute inset-0 opacity-15" style={{
                backgroundImage: 'radial-gradient(#f76b00 1px, transparent 1px), linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
