import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CorporateGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading) setReady(true);
  }, [loading]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/corporate-access" replace />;
  }

  const allowedRoles = ['FOUNDER', 'CEO_MD', 'CHAIRMAN'];
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/corporate-access" replace />;
  }

  return <>{children}</>;
}