import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function SellerVerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const checkVerification = async () => {
    if (!email) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        setVerified(true);
        setLoading(false);
        return;
      }
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!email) {
      setError('Email parameter is missing.');
      setLoading(false);
      return;
    }
    checkVerification();
  }, [email]);

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (resendError) {
        setError(resendError.message || 'Failed to resend verification email.');
      } else {
        setMessage('Verification email resent. Please check your inbox.');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to resend verification email.');
    }
  };

  const handleRefresh = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    await checkVerification();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-blue-700 mb-4">
            <Mail className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
          <p className="text-sm text-gray-600 mt-2">
            We sent a verification link to <span className="font-semibold">{email}</span>.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs">
              {message}
            </div>
          )}

          {verified && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs flex items-center gap-2">
              <CheckCircle size={16} />
              Email verified. You can continue your registration.
            </div>
          )}

          {loading && !verified && (
            <p className="text-xs text-gray-500">Checking verification status...</p>
          )}

          <button
            type="button"
            onClick={handleResend}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
          >
            Resend Verification Email
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh Verification Status
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Continue to login <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}