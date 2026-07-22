import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, Mail } from 'lucide-react';

export default function PendingApproval() {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/seller/approval-status');
        const data = await res.json();
        if (data.status === 'APPROVED') {
          setStatus('APPROVED');
          setMessage('Your seller account has been approved. Redirecting to dashboard...');
          setTimeout(() => {
            window.location.href = '/seller/dashboard';
          }, 1500);
        } else if (data.status === 'REJECTED') {
          setStatus('REJECTED');
          setMessage(data.reason || 'Your application was not approved.');
        }
      } catch (e) {
        // ignore
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          {status === 'PENDING' && (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-700 mb-4">
              <Clock className="w-8 h-8" />
            </div>
          )}
          {status === 'APPROVED' && (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-700 mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
          )}
          {status === 'REJECTED' && (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-700 mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">Registration Completed</h1>
          <p className="text-sm text-gray-600 mt-2">
            Your seller account has been submitted successfully.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 text-xs text-gray-700">
          <p className="font-semibold">Our Founder, Chairman, CEO or Managing Director will review your application.</p>
          <p>You will receive an email after approval.</p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-xs ${status === 'APPROVED' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="space-y-2 text-xs text-gray-600">
          <p className="font-semibold">What happens next?</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your business details are under review.</li>
            <li>Once approved, you can log in and start selling.</li>
            <li>You can bookmark this page to check status.</li>
          </ul>
        </div>

        <div className="text-center">
          <Link to="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}