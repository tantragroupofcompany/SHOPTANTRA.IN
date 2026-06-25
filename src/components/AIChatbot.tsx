import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, ShoppingBag, Truck, BadgeHelp, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockProducts } from '../data/products';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  products?: typeof mockProducts;
  actions?: { label: string; action: string }[];
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Namaste! I am TantraAI, your personal shopping assistant. How can I help you today?',
      actions: [
        { label: '🔥 Show Hot Deals', action: 'deals' },
        { label: '📦 Track My Package', action: 'track' },
        { label: '🏪 Become a Seller', action: 'seller_help' },
        { label: '🌿 Ayurvedic Herbs', action: 'ayurveda' }
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `m-u-${Date.now()}`,
      sender: 'user',
      text: textToSend
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Trigger AI response simulation
    setTimeout(() => {
      const response = generateAIResponse(textToSend.toLowerCase());
      setMessages((prev) => [...prev, response]);
    }, 1000);
  };

  // Simple E-commerce Chatbot Rules Engine
  const generateAIResponse = (query: string): Message => {
    const aiId = `m-a-${Date.now()}`;

    // 1. Check for product recommendations queries
    if (query.includes('headphone') || query.includes('audio') || query.includes('sound')) {
      const found = mockProducts.filter(p => p.category === 'Electronics').slice(0, 2);
      return {
        id: aiId,
        sender: 'ai',
        text: 'I found these premium Tantra Sound headphones in our Electronics catalog. Click to view:',
        products: found
      };
    }

    if (query.includes('kurta') || query.includes('clothes') || query.includes('fashion') || query.includes('dress')) {
      const found = mockProducts.filter(p => p.category === 'Fashion').slice(0, 2);
      return {
        id: aiId,
        sender: 'ai',
        text: 'Check out our authentic handwoven cotton Kurta sets and apparel:',
        products: found
      };
    }

    if (query.includes('ghee') || query.includes('kesar') || query.includes('saffron') || query.includes('grocery') || query.includes('organic')) {
      const found = mockProducts.filter(p => p.category === 'Grocery').slice(0, 2);
      return {
        id: aiId,
        sender: 'ai',
        text: 'Here are our premium Swadeshi Farms organic groceries (including Gir Cow ghee and Pampore kesar):',
        products: found
      };
    }

    if (query.includes('ayurveda') || query.includes('health') || query.includes('ashwagandha') || query.includes('pharma')) {
      const found = mockProducts.filter(p => p.category === 'Health').slice(0, 2);
      return {
        id: aiId,
        sender: 'ai',
        text: 'We recommend these premium GMP certified Ayurvedic formulations for energy and immunity:',
        products: found
      };
    }

    // 2. Check for action triggers
    if (query.includes('deals') || query.includes('discount') || query.includes('coupon') || query.includes('offer')) {
      return {
        id: aiId,
        sender: 'ai',
        text: '🔥 Mega Flash Deals are live! Use coupon code **WELCOME** to get 20% off, or **SHOPTANTRA10** for 10% off. You can also view discounted items on our homepage slider.',
      };
    }

    if (query.includes('track') || query.includes('order') || query.includes('shipment') || query.includes('package')) {
      return {
        id: aiId,
        sender: 'ai',
        text: '📦 You can track your order live inside your User Dashboard under the "Orders" section. Currently, all shipments are integrated with Shiprocket and shipped via Delhivery/Blue Dart. AWB numbers are updated automatically within 2 hours of payment.',
        actions: [{ label: 'Go to Order History', action: 'nav_orders' }]
      };
    }

    if (query.includes('seller') || query.includes('shop') || query.includes('commission')) {
      return {
        id: aiId,
        sender: 'ai',
        text: '🏪 Becoming a seller on SHOPTANTRA is simple! Register your shop, upload your GSTIN, catalog your products, and set up your commission structures. Admin commissions default to 5-10% depending on category. Click below to start registration.',
        actions: [{ label: 'Register as Seller', action: 'nav_seller_reg' }]
      };
    }

    // Default general response
    return {
      id: aiId,
      sender: 'ai',
      text: 'I can search our 12 categories, suggest ayurvedic supplements, provide active coupons, or help you set up a seller store. What would you like to explore?',
      actions: [
        { label: '📱 Show Electronics', action: 'electronics' },
        { label: '🎟️ active Coupons', action: 'deals' },
        { label: '🏪 Start Selling', action: 'seller_help' }
      ]
    };
  };

  // Handle Quick Action button clicks
  const handleActionClick = (action: string) => {
    if (action === 'deals') {
      handleSend('Show me active coupons and deals');
    } else if (action === 'track') {
      handleSend('How do I track my order?');
    } else if (action === 'seller_help') {
      handleSend('How can I become a seller?');
    } else if (action === 'ayurveda') {
      handleSend('Suggest Ayurvedic health supplements');
    } else if (action === 'electronics') {
      handleSend('Show me wireless headphones');
    } else if (action === 'nav_orders') {
      setIsOpen(false);
      window.location.href = '/buyer/orders';
    } else if (action === 'nav_seller_reg') {
      setIsOpen(false);
      window.location.href = '/register/seller';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans print:hidden">
      
      {/* 1. Toggle Chat Icon */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-brand-orange hover:bg-brand-orange-hover text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95"
          title="TantraAI Support"
        >
          <MessageSquare className="w-6 h-6 animate-pulse" />
        </button>
      )}

      {/* 2. Chatbot Dialog Panel */}
      {isOpen && (
        <div className="bg-white dark:bg-brand-navy rounded-2xl w-[330px] sm:w-[360px] h-[480px] shadow-2xl border border-gray-100 dark:border-brand-navy-light/10 flex flex-col justify-between overflow-hidden animate-slide-up">
          
          {/* Header */}
          <div className="bg-brand-navy dark:bg-brand-navy-dark text-white p-4 flex justify-between items-center shrink-0 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="bg-brand-orange/20 p-1.5 rounded-full">
                <Sparkles size={16} className="text-brand-orange" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm flex items-center gap-1">
                  TantraAI Assistant
                </h4>
                <span className="text-[10px] text-green-400 font-semibold block">Online • Instant Support</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Log area */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-brand-navy-dark/30 scrollbar-thin">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Text Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${m.sender === 'user' ? 'bg-brand-orange text-white rounded-tr-none' : 'bg-white dark:bg-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-brand-navy-light/10'}`}
                >
                  {m.text}
                </div>

                {/* Embedded products list */}
                {m.products && (
                  <div className="grid grid-cols-1 gap-2 mt-2 w-full max-w-[90%]">
                    {m.products.map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.id}`}
                        onClick={() => setIsOpen(false)}
                        className="bg-white dark:bg-brand-navy p-2 rounded-xl border border-gray-100 dark:border-brand-navy-light/10 flex items-center gap-2.5 hover:border-brand-orange hover:shadow-sm transition-all text-xs"
                      >
                        <img src={p.images[0]} alt="p" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                          <span className="font-bold text-gray-800 dark:text-gray-200 block truncate">{p.title}</span>
                          <span className="text-[10px] text-brand-orange font-bold">₹{p.price}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Preset quick action buttons */}
                {m.actions && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 w-full">
                    {m.actions.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(act.action)}
                        className="bg-white dark:bg-brand-navy text-gray-700 dark:text-gray-300 hover:bg-brand-orange/10 hover:text-brand-orange border border-gray-200 dark:border-brand-navy-light/10 rounded-full px-3 py-1 text-[10.5px] font-bold transition-all shadow-xs"
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 bg-white dark:bg-brand-navy border-t border-gray-100 dark:border-brand-navy-light/15 flex gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow bg-gray-50 dark:bg-brand-navy-dark text-gray-800 dark:text-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange border-0 transition-all"
            />
            <button
              type="submit"
              className="bg-brand-orange hover:bg-brand-orange-hover text-white p-2.5 rounded-xl flex items-center justify-center transition-colors shadow-xs"
            >
              <Send size={15} />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
