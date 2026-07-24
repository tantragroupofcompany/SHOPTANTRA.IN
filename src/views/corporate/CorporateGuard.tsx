import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

/**
 * CorporateGuard checks for a valid corporate JWT cookie.
 * This is separate from the Supabase AuthContext because
 * corporate users login via Username+Password (JWT), not Supabase.
 */
export default function CorporateGuard({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function verifyAuth() {
      try {
        // Try to decode the JWT from the auth_token cookie via a simple check
        const res = await fetch('/api/corporate/verify', {
          method: 'GET',
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUserRole(data.role);
            setAuthState('authenticated');
            return;
          }
        }
        setAuthState('unauthenticated');
      } catch (e) {
        console.error('Corporate guard verification failed:', e);
        setAuthState('unauthenticated');
      }
    }

    verifyAuth();
  }, []);

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <Navigate to="/corporate-access" replace />;
  }

  return <>{children}</>;
}