import { Award, ShieldCheck, Zap, Heart } from 'lucide-react';

export default function Leadership() {
  const leaders = [
    {
      id: 'founder',
      name: 'Jadav Nilesh',
      role: 'Chairman & Founder',
      image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      bio: 'Jadav Nilesh is the Chairman & founder and primary visionary behind ShopTantra (shoptantra.in). With a strong commitment to empowering India\'s micro, small, and medium enterprises (MSMEs), he conceptualized the platform to bring local vendors and manufacturers into the national digital market. His strategic focus is on vendor accessibility, creating opportunities for small artisans and rural merchants to sell their products directly to consumers globally.',
      icon: Heart,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'md',
      name: 'Nayna Jadav',
      role: 'Managing Director (MD)',
      image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
      bio: 'Nayna Jadav serves as the Managing Director at ShopTantra, overseeing day-to-day corporate operations, legal compliance, merchant policies, and administrative structures. She plays a pivotal role in maintaining seller-buyer harmony, vendor onboarding protocols, and managing the financial logistics of the marketplace. Under her management, the company has expanded its partnerships with major shipping providers and local seller networks across India.',
      icon: ShieldCheck,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'ceo',
      name: 'Jadav Jayesh',
      role: 'Chief Executive Officer (CEO)',
      image: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg',
      bio: 'Jadav Jayesh is the Chief Executive Officer (CEO) of ShopTantra, leading the technological transformation and platform scalability. He oversees the development of payment gateway nodes (Razorpay split payouts), automated wallet ledgers, security frameworks, and artificial intelligence-driven product search systems. His technical and corporate leadership ensures that ShopTantra remains a highly secure, fast, and modern e-commerce platform.',
      icon: Zap,
      color: 'from-teal-500 to-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-brand-navy-dark transition-colors duration-300">
      
      {/* Hero */}
      <section className="bg-gradient-to-r from-brand-navy via-brand-navy-light to-brand-navy text-white py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <span className="bg-brand-orange text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">Corporate Board</span>
          <h1 className="text-4xl sm:text-5xl font-black mt-4 mb-6">Company Introduction & Leadership</h1>
          <p className="text-sm sm:text-base text-gray-200 leading-relaxed max-w-xl mx-auto">
            Meet the core visionaries behind India's premier multi-vendor marketplace platform.
          </p>
        </div>
      </section>

      {/* Profiles */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {leaders.map((leader, i) => {
            const Icon = leader.icon;
            return (
              <div 
                key={leader.id} 
                id={leader.id} 
                className="scroll-mt-24 bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 p-8 rounded-3xl shadow-sm flex flex-col md:flex-row gap-8 items-center"
              >
                {/* Photo */}
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shrink-0 border border-gray-100 dark:border-brand-navy-light/10 shadow-sm">
                  <img 
                    src={leader.image} 
                    alt={leader.name} 
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 bg-gradient-to-r ${leader.color} text-white rounded-lg flex items-center justify-center`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange">{leader.role}</span>
                      <h2 className="text-2xl font-extrabold text-black dark:text-white leading-tight">{leader.name}</h2>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-black dark:text-gray-300 leading-relaxed">
                    {leader.bio}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
