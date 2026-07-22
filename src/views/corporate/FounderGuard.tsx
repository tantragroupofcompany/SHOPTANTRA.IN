import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function FounderGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading) setReady(true);
  }, [loading]);

  if (!ready) return null;

  if (!profile || profile.role !== 'FOUNDER') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}