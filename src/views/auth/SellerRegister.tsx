import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { AlertCircle, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { scrollToErrorAndFocus } from '../../lib/formUtils';

type Step = 1 | 2 | 3;

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface BusinessInfo {
  storeName: string;
  businessType: string;
  customBusinessType?: string;
  city: string;
  state: string;
  pinCode: string;
  panCard: string;
}

export default function SellerRegister() {
  const navigate = useNavigate();
  const { signUp, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    storeName: '',
    businessType: '',
    customBusinessType: '',
    city: '',
    state: '',
    pinCode: '',
    panCard: '',
  });

  const businessTypes = [
    'Electronics',
    'Fashion & Apparel',
    'Home & Garden',
    'Sports & Outdoors',
    'Books & Media',
    'Health & Beauty',
    'Toys & Games',
    'Food & Beverages',
    'Arts & Crafts',
    'Other',
  ];

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalInfo({
      ...personalInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleBusinessInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setBusinessInfo({
      ...businessInfo,
      [e.target.name]: e.target.value,
    });
  };

  const validatePersonalInfo = (): boolean => {
    if (!personalInfo.fullName.trim()) {
      setError('Full name is required');
      scrollToErrorAndFocus();
      return false;
    }
    if (!personalInfo.email.trim()) {
      setError('Email is required');
      scrollToErrorAndFocus();
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalInfo.email.trim())) {
      setError('Please enter a valid email address');
      scrollToErrorAndFocus();
      return false;
    }

    if (!personalInfo.phone.trim()) {
      setError('Phone number is required');
      scrollToErrorAndFocus();
      return false;
    }

    const phoneRegex = /^[+]?[0-9\s\-()]{10,18}$/;
    if (!phoneRegex.test(personalInfo.phone.trim())) {
      setError('Please enter a valid phone number (at least 10 digits)');
      scrollToErrorAndFocus();
      return false;
    }

    if (!personalInfo.password) {
      setError('Password is required');
      scrollToErrorAndFocus();
      return false;
    }
    if (personalInfo.password.length < 6) {
      setError('Password must be at least 6 characters');
      scrollToErrorAndFocus();
      return false;
    }
    if (personalInfo.password !== personalInfo.confirmPassword) {
      setError('Passwords do not match');
      scrollToErrorAndFocus();
      return false;
    }
    return true;
  };

  const validateBusinessInfo = (): boolean => {
    if (!businessInfo.storeName.trim()) {
      setError('Store name is required');
      scrollToErrorAndFocus();
      return false;
    }
    if (!businessInfo.businessType) {
      setError('Business type is required');
      scrollToErrorAndFocus();
      return false;
    }
    if (businessInfo.businessType === 'Other' && !businessInfo.customBusinessType?.trim()) {
      setError('Please specify your custom business category');
      scrollToErrorAndFocus();
      return false;
    }
    if (!businessInfo.city.trim()) {
      setError('City is required');
      scrollToErrorAndFocus();
      return false;
    }
    if (!businessInfo.state.trim()) {
      setError('State is required');
      scrollToErrorAndFocus();
      return false;
    }
    if (!businessInfo.pinCode.trim()) {
      setError('PIN Code is required');
      scrollToErrorAndFocus();
      return false;
    }
    if (!businessInfo.panCard.trim()) {
      setError('PAN Card is required');
      scrollToErrorAndFocus();
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError(null);

    if (currentStep === 1) {
      if (validatePersonalInfo()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateBusinessInfo()) {
        setCurrentStep(3);
      }
    }
  };

  const handlePreviousStep = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signUpError } = await signUp(
        personalInfo.email.trim(),
        personalInfo.password,
        personalInfo.fullName.trim(),
        'seller',
        {
          phone: personalInfo.phone.trim(),
          storeName: businessInfo.storeName.trim(),
          businessType: businessInfo.businessType === 'Other' ? businessInfo.customBusinessType?.trim() : businessInfo.businessType,
          city: businessInfo.city.trim(),
          state: businessInfo.state.trim(),
          pinCode: businessInfo.pinCode.trim(),
          panCard: businessInfo.panCard.trim()
        }
      );

      if (signUpError) {
        setError(signUpError.message || 'Registration failed. Please try again.');
        scrollToErrorAndFocus();
        setLoading(false);
        return;
      }

      // Redirect to OTP verification page after successful registration
      navigate(`/seller/verify-email?email=${encodeURIComponent(personalInfo.email.trim())}`);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
      scrollToErrorAndFocus();
      setLoading(false);
    }
  };

  const isLoading = loading || authLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/register')}
          className="flex items-center gap-2 text-[#1B3A6B] hover:text-blue-900 mb-8 font-medium"
          disabled={isLoading}
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1B3A6B] rounded-lg mb-4">
            <span className="text-white font-bold text-lg">ST</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1B3A6B]">ShopTantra</h1>
          <p className="text-gray-600 mt-2">Create your seller account</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-xs mx-auto">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition ${
                    step < currentStep
                      ? 'bg-orange-500 text-white'
                      : step === currentStep
                        ? 'bg-[#1B3A6B] text-white'
                        : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-2 font-semibold whitespace-nowrap">
                  {step === 1 ? 'Personal' : step === 2 ? 'Business' : 'Review'}
                </p>
              </div>
            ))}
          </div>
          <div className="flex mt-4">
            {[1, 2].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1 mx-1 rounded ${
                  step < currentStep ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  value={personalInfo.fullName}
                  onChange={handlePersonalInfoChange}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={personalInfo.email}
                  onChange={handlePersonalInfoChange}
                  placeholder="seller@example.com"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={personalInfo.phone}
                  onChange={handlePersonalInfoChange}
                  placeholder="+1 (555) 123-4567"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={personalInfo.password}
                    onChange={handlePersonalInfoChange}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={personalInfo.confirmPassword}
                    onChange={handlePersonalInfoChange}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Information */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="storeName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Store Name
                </label>
                <input
                  id="storeName"
                  type="text"
                  name="storeName"
                  value={businessInfo.storeName}
                  onChange={handleBusinessInfoChange}
                  placeholder="My Awesome Store"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="businessType" className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Type
                </label>
                <select
                  id="businessType"
                  name="businessType"
                  value={businessInfo.businessType}
                  onChange={handleBusinessInfoChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                >
                  <option value="">Select a business type</option>
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {businessInfo.businessType === 'Other' && (
                <div>
                  <label htmlFor="customBusinessType" className="block text-sm font-semibold text-gray-700 mb-2">
                    Specify Category (e.g. Grocery, Milk Store)
                  </label>
                  <input
                    id="customBusinessType"
                    type="text"
                    name="customBusinessType"
                    value={businessInfo.customBusinessType}
                    onChange={handleBusinessInfoChange}
                    placeholder="Grocery Store"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    disabled={isLoading}
                  />
                </div>
              )}

              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={businessInfo.city}
                  onChange={handleBusinessInfoChange}
                  placeholder="New York"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  name="state"
                  value={businessInfo.state}
                  onChange={handleBusinessInfoChange}
                  placeholder="NY"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="pinCode" className="block text-sm font-semibold text-gray-700 mb-2">
                  PIN Code
                </label>
                <input
                  id="pinCode"
                  type="text"
                  name="pinCode"
                  value={businessInfo.pinCode}
                  onChange={handleBusinessInfoChange}
                  placeholder="123456"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="panCard" className="block text-sm font-semibold text-gray-700 mb-2">
                  PAN Card Number
                </label>
                <input
                  id="panCard"
                  type="text"
                  name="panCard"
                  value={businessInfo.panCard}
                  onChange={handleBusinessInfoChange}
                  placeholder="ABCDE1234F"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition uppercase"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-[#1B3A6B] mb-4">Personal Information</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">Name:</span>{' '}
                    <span className="font-medium">{personalInfo.fullName}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Email:</span>{' '}
                    <span className="font-medium">{personalInfo.email}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Phone:</span>{' '}
                    <span className="font-medium">{personalInfo.phone}</span>
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="font-semibold text-[#1B3A6B] mb-4">Business Information</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">Store Name:</span>{' '}
                    <span className="font-medium">{businessInfo.storeName}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Business Type:</span>{' '}
                    <span className="font-medium">
                      {businessInfo.businessType === 'Other' 
                        ? businessInfo.customBusinessType 
                        : businessInfo.businessType}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">Location:</span>{' '}
                    <span className="font-medium">
                      {businessInfo.city}, {businessInfo.state} - {businessInfo.pinCode}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">PAN Card:</span>{' '}
                    <span className="font-medium">{businessInfo.panCard}</span>
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                By submitting, you agree to our Terms of Service and confirm that all information is accurate.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePreviousStep}
                disabled={isLoading}
                className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={isLoading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 bg-[#1B3A6B] hover:bg-blue-900 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
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
  );
}
