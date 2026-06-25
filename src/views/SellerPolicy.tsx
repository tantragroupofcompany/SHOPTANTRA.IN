import { ShieldAlert, Percent, Award, Landmark } from 'lucide-react';

export default function SellerPolicy() {
  const policies = [
    {
      icon: Percent,
      title: 'Fair Commission Tiers',
      desc: 'Platform commissions range from 5% to 15% depending on product categories. Customized commission splits can be agreed upon for high-volume manufacturers.'
    },
    {
      icon: Landmark,
      title: 'Direct Vendor Payouts',
      desc: 'Earnings are automatically calculated, split-deducted, and credited directly to the vendor\'s linked bank account or UPI address upon order delivery completion.'
    },
    {
      icon: ShieldAlert,
      title: 'KYC & Onboarding Rules',
      desc: 'All merchants must upload valid business documents, including GSTIN (where applicable), PAN card, and bank account proof, to ensure marketplace trust.'
    },
    {
      icon: Award,
      title: 'Authenticity Guarantee',
      desc: 'Sellers are strictly prohibited from listing replica, counterfeit, or prohibited goods. Doing so results in immediate wallet freezing and account suspension.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-brand-navy-dark transition-colors duration-300">
      
      {/* Hero */}
      <section className="bg-gradient-to-r from-brand-navy via-brand-navy-light to-brand-navy text-white py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <span className="bg-brand-orange text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">Merchant Center</span>
          <h1 className="text-4xl sm:text-5xl font-black mt-4 mb-6">Seller Policy & Fees</h1>
          <p className="text-sm sm:text-base text-gray-200 leading-relaxed max-w-xl mx-auto">
            Guidelines, fee structures, and merchant protocols for selling on ShopTantra.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white dark:bg-brand-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid sm:grid-cols-2 gap-6">
            {policies.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="p-6 bg-gray-50/50 dark:bg-brand-navy-dark border border-gray-150/40 dark:border-brand-navy-light/10 rounded-2xl shadow-xs space-y-3">
                  <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-orange" />
                  </div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-white">{item.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <hr className="border-gray-100 dark:border-brand-navy-light/10" />

          <div className="space-y-6 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            <h2 className="text-xl font-bold text-brand-navy dark:text-white">Fee Structure & Commission Details</h2>
            <p>
              ShopTantra operates a multi-tier commission system designed to maximize vendor profits. Our base platform fee covers secure transaction nodes, server maintenance, logistics management, and buyer customer support.
            </p>
            <p>
              **Category-wise Standard Commission Schedules:**
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>**Apparel & Fashion:** 12% per completed order.</li>
              <li>**Herbal & Ayurvedic Products:** 8% per completed order.</li>
              <li>**Groceries & Organic Staples:** 5% per completed order.</li>
              <li>**Electronics & Gadgets:** 6% per completed order.</li>
            </ul>
            <p>
              For bulk manufacturers or specific cooperative organizations, we offer custom commission terms which can be set dynamically by the administrator via the **Admin Commission Control Panel**.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}
