import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new Username+Password executive login
    navigate('/corporate-access', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-[#1B3A6B] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Building2 className="w-12 h-12 text-white animate-pulse" />
        </div>
        <p className="text-blue-200 text-sm">
          Redirecting to executive login...
        </p>
        <Link to="/corporate-access" className="mt-4 inline-block text-blue-300 hover:text-white text-sm underline transition-colors">
          Click here if not redirected
        </Link>
      </div>
    </div>
  );
}