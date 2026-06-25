import { useState, useEffect } from 'react';
import { CheckCircle2, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  products_limit: number;
  orders_limit: number;
  commission_percentage: number;
  features: string[];
  is_popular: boolean;
}

const PlansPage = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('monthly_price', { ascending: true });

        if (error) throw error;
        setPlans(data || []);
      } catch (error) {
        console.error('Error fetching plans:', error);
        // Fallback to default plans
        setPlans([
          {
            id: '1',
            name: 'Free',
            monthly_price: 0,
            yearly_price: 0,
            products_limit: 10,
            orders_limit: 50,
            commission_percentage: 15,
            features: ['Basic Analytics', 'Email Support'],
            is_popular: false,
          },
          {
            id: '2',
            name: 'Starter',
            monthly_price: 999,
            yearly_price: 9999,
            products_limit: 100,
            orders_limit: 500,
            commission_percentage: 12,
            features: ['Advanced Analytics', 'Priority Email Support', 'API Access'],
            is_popular: false,
          },
          {
            id: '3',
            name: 'Professional',
            monthly_price: 2999,
            yearly_price: 29999,
            products_limit: 1000,
            orders_limit: 5000,
            commission_percentage: 8,
            features: [
              'Advanced Analytics',
              'Priority Support',
              'API Access',
              'Custom Branding',
              'Dedicated Manager',
            ],
            is_popular: true,
          },
          {
            id: '4',
            name: 'Enterprise',
            monthly_price: 9999,
            yearly_price: 99999,
            products_limit: -1,
            orders_limit: -1,
            commission_percentage: 5,
            features: [
              'Unlimited Everything',
              '24/7 Phone Support',
              'API Access',
              'Custom Branding',
              'Dedicated Team',
              'Custom Integrations',
            ],
            is_popular: false,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-200 rounded-lg h-96 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Scale your business with the perfect plan for you
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-lg font-medium ${
                !isYearly ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isYearly ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-lg font-medium ${
                isYearly ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Yearly
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const price = isYearly ? plan.yearly_price : plan.monthly_price;
              const savings = isYearly && plan.yearly_price > 0;

              return (
                <div
                  key={plan.id}
                  className={`rounded-lg border-2 transition-all relative overflow-hidden ${
                    plan.is_popular
                      ? 'border-orange-500 shadow-2xl transform scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.is_popular && (
                    <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 text-sm font-semibold">
                      MOST POPULAR
                    </div>
                  )}

                  {/* Savings Badge */}
                  {savings && (
                    <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-xs font-semibold rounded-br">
                      Save 20%
                    </div>
                  )}

                  <div className={`p-8 ${plan.is_popular ? 'bg-blue-50' : 'bg-white'}`}>
                    {/* Plan Name */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">
                          ₹{price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-gray-600 font-medium">
                          {isYearly ? '/year' : '/month'}
                        </span>
                      </div>
                    </div>

                    {/* Limits */}
                    <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">
                          {plan.products_limit === -1
                            ? 'Unlimited'
                            : plan.products_limit}
                        </span>{' '}
                        Products
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">
                          {plan.orders_limit === -1
                            ? 'Unlimited'
                            : plan.orders_limit}
                        </span>{' '}
                        Orders
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">
                          {plan.commission_percentage}%
                        </span>{' '}
                        Commission
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle2
                            className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                          />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Link
                      to="/register/seller"
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors text-center block ${
                        plan.is_popular
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'border-2 border-orange-500 text-orange-500 hover:bg-orange-50'
                      }`}
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlansPage;
