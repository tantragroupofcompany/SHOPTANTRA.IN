import { RefreshCw, ShieldCheck, Heart, AlertCircle } from 'lucide-react';

export default function RefundPolicy() {
  const provisions = [
    {
      title: '7-Day Return Window',
      desc: 'Eligible items can be returned within 7 days of package delivery if they are unused, undamaged, and in original packaging.'
    },
    {
      title: '100% Secure Refunds',
      desc: 'Once approved, refunds are credited back to the customer\'s original payment source (UPI, Card, Net Banking) within 5-7 business days.'
    },
    {
      title: 'Product Replacement',
      desc: 'Defective or incorrect items will be replaced immediately by the vendor at no extra shipping cost to the buyer.'
    },
    {
      title: 'Direct Vendor Escrow Protection',
      desc: 'Payments remain in a secure Vercel/Razorpay node escrow until the return window closes, protecting buyers from fraudulent sales.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-brand-navy-dark transition-colors duration-300">
      
      {/* Hero */}
      <section className="bg-gradient-to-r from-brand-navy via-brand-navy-light to-brand-navy text-white py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <span className="bg-brand-orange text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">Buyer Protection</span>
          <h1 className="text-4xl sm:text-5xl font-black mt-4 mb-6">Return & Refund Policy</h1>
          <p className="text-sm sm:text-base text-gray-200 leading-relaxed max-w-xl mx-auto">
            Ensuring a transparent and secure shopping experience on India's #1 Multi-Vendor Marketplace.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white dark:bg-brand-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid sm:grid-cols-2 gap-6">
            {provisions.map((item, i) => (
              <div key={i} className="p-6 bg-gray-50/50 dark:bg-brand-navy-dark border border-gray-150/40 dark:border-brand-navy-light/10 rounded-2xl shadow-xs space-y-3">
                <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-brand-orange rounded-full"></span>
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <hr className="border-gray-100 dark:border-brand-navy-light/10" />

          <div className="space-y-6 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            <h2 className="text-xl font-bold text-brand-navy dark:text-white">Detailed Refund Terms</h2>
            <p>
              ShopTantra (shoptantra.in) acts as a marketplace coordinator. Returns are governed by the respective product category guidelines set by the merchants. Groceries and perishable food items are exempt from returns unless received spoiled or damaged.
            </p>
            <p>
              To initiate a return:
            </p>
            <ol className="list-decimal list-inside space-y-2 pl-4">
              <li>Log in to your **Buyer Dashboard** and go to **Order History**.</li>
              <li>Click on the active order and select **Request Refund / Return**.</li>
              <li>Upload images of the product showing any damage, sizing issues, or mismatch.</li>
              <li>Select your preferred payout method (Original Payment Source or ShopTantra Wallet).</li>
            </ol>
            <p>
              Our support team verifies all refund requests in coordination with the respective vendors to resolve disputes fairly within 48 hours. For any assistance, reach out directly at **support@shoptantra.in**.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}
