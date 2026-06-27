import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { scrollToErrorAndFocus } from '../../lib/formUtils';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, loading } = useAuth();
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin Check States
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // First Admin Account Form States
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminMobile, setAdminMobile] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  useEffect(() => {
    const checkAdminPresence = async () => {
      try {
        const response = await fetch('/api/auth/check-admin');
        const data = await response.json();
        if (data.success) {
          setHasAdmin(data.hasAdmin);
        } else {
          setHasAdmin(true); // Fallback to standard login to prevent lockout
        }
      } catch (err) {
        console.error('Error checking admin presence:', err);
        setHasAdmin(true); // Fallback to standard login
      } finally {
        setCheckingAdmin(false);
      }
    };
    checkAdminPresence();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email.trim()) {
      setError('Email address is required');
      scrollToErrorAndFocus();
      return;
    }
    if (!password) {
      setError('Password is required');
      scrollToErrorAndFocus();
      return;
    }

    try {
      const { error: signInError, profile } = await signIn(email.trim(), password);
      if (signInError) {
        setError(signInError.message || 'Login failed. Please check your credentials.');
        scrollToErrorAndFocus();
        return;
      }
      
      // Navigate based on user role profile
      if (profile?.role === 'seller') {
        navigate('/seller');
      } else if (profile?.role === 'buyer') {
        navigate('/buyer');
      } else if (profile?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during sign in.');
      scrollToErrorAndFocus();
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminName.trim()) {
      setError('Full Name is required');
      scrollToErrorAndFocus();
      return;
    }
    if (!adminEmail.trim()) {
      setError('Email address is required');
      scrollToErrorAndFocus();
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail.trim())) {
      setError('Please enter a valid email address');
      scrollToErrorAndFocus();
      return;
    }
    if (!adminMobile.trim()) {
      setError('Mobile Number is required');
      scrollToErrorAndFocus();
      return;
    }
    const phoneRegex = /^[+]?[0-9\s\-()]{10,18}$/;
    if (!phoneRegex.test(adminMobile.trim())) {
      setError('Please enter a valid phone number (at least 10 digits)');
      scrollToErrorAndFocus();
      return;
    }
    if (!adminPassword) {
      setError('Password is required');
      scrollToErrorAndFocus();
      return;
    }
    
    // Strong password check: min 8 chars, 1 upper, 1 lower, 1 digit, 1 special char
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordRegex.test(adminPassword)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      scrollToErrorAndFocus();
      return;
    }

    if (adminPassword !== adminConfirmPassword) {
      setError('Passwords do not match');
      scrollToErrorAndFocus();
      return;
    }

    try {
      const { error: signUpError } = await signUp(
        adminEmail.trim(),
        adminPassword,
        adminName.trim(),
        'admin',
        { phone: adminMobile.trim() }
      );

      if (signUpError) {
        setError(signUpError.message || 'Failed to create administrator account.');
        scrollToErrorAndFocus();
        return;
      }

      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during admin registration.');
      scrollToErrorAndFocus();
    }
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <img src="/SHOPTANTRA.png" alt="ShopTantra" className="h-16 object-contain" />
          </div>
          <p className="text-gray-600 mt-2">
            {hasAdmin ? 'Welcome back to your store' : 'System Initialization Wizard'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!hasAdmin ? (
            /* First Admin Creation Wizard */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#1B3A6B] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-[#1B3A6B]">Create First Admin Account</h3>
                  <p className="text-xs text-gray-650 mt-1 leading-relaxed">
                    No administrator accounts exist in the database. Please configure the primary super-user account to initialize the Shoptantra platform.
                  </p>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="adminName" className="block text-sm font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="adminName"
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="adminEmail" className="block text-sm font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@domain.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label htmlFor="adminMobile" className="block text-sm font-semibold text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  id="adminMobile"
                  type="tel"
                  value={adminMobile}
                  onChange={(e) => setAdminMobile(e.target.value)}
                  placeholder="9876543210"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="adminPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                  Strong Password
                </label>
                <div className="relative">
                  <input
                    id="adminPassword"
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    {showAdminPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                  Must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="adminConfirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="adminConfirmPassword"
                  type="password"
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1B3A6B] hover:bg-blue-900 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? 'Initializing system...' : 'Create Admin & Initialize'}
              </button>
            </form>
          ) : (
            /* Standard Login Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-orange-550 hover:text-orange-600 font-medium"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1B3A6B] hover:bg-blue-900 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {hasAdmin && (
            <>
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to ShopTantra?</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <Link
                to="/register"
                className="block w-full text-center py-2.5 border-2 border-orange-500 text-orange-500 hover:bg-orange-50 font-semibold rounded-lg transition"
              >
                Create Account
              </Link>

              {/* Admin Access Link */}
              <div className="mt-6 text-center">
                <Link
                  to="/admin-login"
                  className="text-xs font-semibold text-gray-400 hover:text-[#1B3A6B] transition-colors uppercase tracking-wider flex items-center justify-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3" /> Executive Access
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-650 mt-6">
          By signing in, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
