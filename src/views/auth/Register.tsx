import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Store } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-[#1B3A6B] rounded-lg">
              <span className="text-white font-bold">ST</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1B3A6B]">ShopTantra</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#1B3A6B] mb-3">
            Join ShopTantra
          </h2>
          <p className="text-lg text-gray-600">
            Choose your role and get started in minutes
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Buyer Card */}
          <button
            onClick={() => navigate('/register/buyer')}
            className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden p-8 text-left hover:scale-105 border-2 border-transparent hover:border-orange-500"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:bg-orange-50 transition"></div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-100 transition">
                <ShoppingCart className="w-8 h-8 text-[#1B3A6B] group-hover:text-orange-500 transition" />
              </div>

              <h3 className="text-2xl font-bold text-[#1B3A6B] mb-2">
                I Want to Buy
              </h3>

              <p className="text-gray-600 mb-6 leading-relaxed">
                Browse thousands of products, connect with sellers, and discover amazing deals from merchants worldwide.
              </p>

              <div className="flex items-center gap-2 text-orange-500 font-semibold">
                <span>Get Started</span>
                <span className="group-hover:translate-x-2 transition">→</span>
              </div>
            </div>
          </button>

          {/* Seller Card */}
          <button
            onClick={() => navigate('/register/seller')}
            className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden p-8 text-left hover:scale-105 border-2 border-transparent hover:border-orange-500"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:bg-orange-50 transition"></div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-100 transition">
                <Store className="w-8 h-8 text-[#1B3A6B] group-hover:text-orange-500 transition" />
              </div>

              <h3 className="text-2xl font-bold text-[#1B3A6B] mb-2">
                I Want to Sell
              </h3>

              <p className="text-gray-600 mb-6 leading-relaxed">
                Launch your online store, reach millions of buyers, and grow your business with our powerful seller tools.
              </p>

              <div className="flex items-center gap-2 text-orange-500 font-semibold">
                <span>Get Started</span>
                <span className="group-hover:translate-x-2 transition">→</span>
              </div>
            </div>
          </button>
        </div>

        {/* Already have account */}
        <div className="text-center mt-12">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-orange-500 hover:text-orange-600 font-semibold"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#1B3A6B] text-white py-8 mt-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm">
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
