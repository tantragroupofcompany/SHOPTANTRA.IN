import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, KeyRound, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { scrollToErrorAndFocus } from '../../lib/formUtils';
import shoptantraLogo from '../../assets/SHOPTANTRA.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email.trim()) {
      setError('Email address is required');
      scrollToErrorAndFocus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request OTP');
      }

      setStep(2);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      scrollToErrorAndFocus();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp.trim() || otp.length !== 7) {
      setError('Please enter a valid 7-digit OTP');
      scrollToErrorAndFocus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      // Successful OTP Login
      // Set the token (JWT from edge) into localstorage if needed by client, or just rely on secure cookie if that's what backend does.
      // Assuming backend sets HTTP-only cookie, but let's also store token if returned:
      if (data.token) {
        localStorage.setItem('admin_auth_token', data.token);
      }

      // Redirect to admin dashboard
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP.');
      scrollToErrorAndFocus();
      if (err.message.includes('Account locked')) {
        setStep(1); // Force them back if locked
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-[#1B3A6B] flex items-center justify-center px-4 py-12 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500 blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={shoptantraLogo} alt="ShopTantra" className="h-14 object-contain brightness-0 invert" />
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl mb-6 shadow-2xl">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Executive Access</h1>
          <p className="text-blue-200 mt-2 text-sm font-medium">
            ShopTantra Management Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200 font-medium">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-blue-100 mb-2">
                  Executive Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-blue-300" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@shoptantra.in"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition placeholder:text-blue-300/50"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-blue-200 text-sm">
                  We sent a 7-digit secure code to
                  <br/>
                  <span className="text-white font-semibold">{email}</span>
                </p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-blue-100 mb-2 text-center">
                  Enter Authentication Code
                </label>
                <div className="relative max-w-[240px] mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-blue-300" />
                  </div>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={7}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="0000000"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 text-white text-center text-2xl tracking-widest rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition placeholder:text-blue-300/30 font-mono"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 7}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full bg-transparent hover:bg-white/5 text-blue-200 font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Email
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link to="/login" className="text-sm text-blue-300 hover:text-white transition-colors">
            Return to standard login
          </Link>
        </div>
      </div>
    </div>
  );
}
