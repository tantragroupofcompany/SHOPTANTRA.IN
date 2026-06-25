import { Truck, MapPin, ClipboardList, ShieldAlert } from 'lucide-react';

export default function ShippingPolicy() {
  const steps = [
    {
      icon: ClipboardList,
      title: 'Order Dispatch in 24 Hours',
      desc: 'Sellers are required to pack and dispatch orders within 24-48 hours of order confirmation. Pickups are handled by automated logistics nodes.'
    },
    {
      icon: Truck,
      title: 'Trusted Shipping Nodes',
      desc: 'We partner with Shiprocket, Delhivery, BlueDart, and India Post to ensure secure and fast shipping to over 26,000 pin codes across India.'
    },
    {
      icon: MapPin,
      title: 'Estimated Delivery Times',
      desc: 'Metro cities: 2-3 business days. Non-metro locations: 4-6 business days. Northeast and remote regions: 7-9 business days.'
    },
    {
      icon: ShieldAlert,
      title: 'Transit Insurance Protection',
      desc: 'All packages are insured against damage and theft during transit. High-value parcels require verification on delivery.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-brand-navy-dark transition-colors duration-300">
      
      {/* Hero */}
      <section className="bg-gradient-to-r from-brand-navy via-brand-navy-light to-brand-navy text-white py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <span className="bg-brand-orange text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">Logistics & Tracking</span>
          <h1 className="text-4xl sm:text-5xl font-black mt-4 mb-6">Shipping & Delivery Policy</h1>
          <p className="text-sm sm:text-base text-gray-200 leading-relaxed max-w-xl mx-auto">
            Providing reliable and fast nationwide delivery to your doorstep.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white dark:bg-brand-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid sm:grid-cols-2 gap-6">
            {steps.map((item, i) => {
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
            <h2 className="text-xl font-bold text-brand-navy dark:text-white">AWB Tracking & Support</h2>
            <p>
              Once your package is dispatched by the seller, an automated Airway Bill (AWB) tracking number is generated and sent to your registered email and mobile number via SMS. You can track your order live from your **Buyer Dashboard** under the order tracking section.
            </p>
            <p>
              **Shipping Rates:**
            </p>
            <p>
              Shipping fees are calculated dynamically at checkout based on package weight, package dimensions, destination pin code, and the shipping tier selected. Orders above **₹499** qualify for **Free Standard Shipping** nationwide.
            </p>
            <p>
              If your package is delayed or showing incorrect tracking details, please contact our marketplace operations desk at **support@shoptantra.in** for immediate assistance.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}
