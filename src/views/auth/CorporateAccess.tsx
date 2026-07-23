import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

type CorporateRole = 'FOUNDER' | 'CEO_MD' | 'CHAIRMAN';

interface RoleConfig {
  role: CorporateRole;
  label: string;
  description: string;
  dashboard: string;
}

const ROLE_CONFIGS: RoleConfig[] = [
  {
    role: 'FOUNDER',
    label: 'Founder Portal',
    description: 'Full website control and executive oversight.',
    dashboard: '/founder/dashboard',
  },
  {
    role: 'CEO_MD',
    label: 'CEO & MD Portal',
    description: 'Operations, sales, orders, and performance.',
    dashboard: '/ceo/dashboard',
  },
  {
    role: 'CHAIRMAN',
    label: 'Chairman Portal',
    description: 'Management, financial reports, and analytics.',
    dashboard: '/chairman/dashboard',
  },
];

export default function CorporateAccess() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<CorporateRole | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/corporate/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid username or password.');
        setLoading(false);
        return;
      }

      const roleConfig = ROLE_CONFIGS.find((r) => r.role === data.user.role);
      if (roleConfig) {
        navigate(roleConfig.dashboard);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError('Invalid username or password.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
            <Building2 className="w-8 h-8 text-brand-orange" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Corporate Control Center</h1>
          <p className="text-gray-300 mt-2 text-sm">
            Executive access only. Select your portal to continue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {ROLE_CONFIGS.map((item) => (
            <button
              key={item.role}
              onClick={() => {
                setSelectedRole(item.role);
                setError(null);
              }}
              className={`text-left rounded-xl p-6 border transition ${
                selectedRole === item.role
                  ? 'bg-brand-orange/20 border-brand-orange'
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <h3 className="font-bold text-lg">{item.label}</h3>
              <p className="text-xs text-gray-300 mt-2">{item.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-orange">
                Access this portal <ArrowRight size={14} />
              </span>
            </button>
          ))}
        </div>

        {selectedRole && (
          <div className="bg-white text-gray-900 rounded-xl shadow-lg p-8 max-w-xl mx-auto">
            <h2 className="text-xl font-bold mb-1">
              {ROLE_CONFIGS.find((r) => r.role === selectedRole)?.label} Login
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Enter your executive username and password.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none"
                    placeholder="founder_2027"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                />
                <label htmlFor="remember" className="text-xs text-gray-500">Remember me</label>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full flex justify-center items-center gap-2"
                loading={loading}
              >
                Access Corporate Portal
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
                Back to homepage
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}