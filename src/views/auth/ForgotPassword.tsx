import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, ArrowLeft, CheckCircle, Mail, Send } from 'lucide-react';
import { scrollToErrorAndFocus } from '../../lib/formUtils';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setResetLink(null);

    if (!email.trim()) {
      setError('Email address is required');
      scrollToErrorAndFocus();
      return;
    }

    try {
      const { error: resetError, link } = await forgotPassword(email.trim());
      if (resetError) {
        setError(resetError.message);
        scrollToErrorAndFocus();
      } else {
        setSuccess('A password reset link has been successfully generated.');
        if (link) {
          setResetLink(link);
        }
        setEmail('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      scrollToErrorAndFocus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-[#1B3A6B] hover:text-blue-900 mb-8 font-medium transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Login
        </button>

        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1B3A6B] rounded-lg mb-4">
            <span className="text-white font-bold text-lg">ST</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1B3A6B]">ShopTantra</h1>
          <p className="text-gray-600 mt-2">Reset your account password</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3" role="alert">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 font-medium">{success}</p>
              </div>
              
              {resetLink && (
                <div className="mt-2 p-3 bg-white border border-green-150 rounded-lg text-xs">
                  <p className="text-gray-500 font-semibold mb-1">Password Reset Link:</p>
                  <a 
                    href={resetLink} 
                    className="text-orange-500 hover:text-orange-600 hover:underline font-mono break-all"
                  >
                    {resetLink}
                  </a>
                  <p className="text-gray-400 mt-1.5">Click the link above to reset your password. This link expires in 10 minutes.</p>
                </div>
              )}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-gray-500 leading-relaxed">
                Enter your email address below, and we will generate a secure link to reset your password.
              </p>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    disabled={loading}
                  />
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1B3A6B] hover:bg-blue-900 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
              >
                {loading ? 'Generating Link...' : 'Send Reset Link'}
                <Send size={16} />
              </button>
            </form>
          )}

          <div className="text-center mt-6 pt-6 border-t border-gray-100">
            <Link
              to="/login"
              className="text-sm text-orange-500 hover:text-orange-600 font-semibold"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
