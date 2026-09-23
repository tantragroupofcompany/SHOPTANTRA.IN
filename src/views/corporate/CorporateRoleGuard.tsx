import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface CorporateRoleGuardProps {
  /** Roles allowed to render the wrapped dashboard, e.g. `['FOUNDER']`. */
  allow: string[];
  children: React.ReactNode;
}

/**
 * Shared guard for the executive dashboards (`/founder`, `/ceo`, `/chairman`).
 *
 * Executive users authenticate at `/api/corporate/login`, which sets a signed
 * JWT in the `corporate_auth_token` / `auth_token` cookies. They never get a
 * Supabase session, so `useAuth()` is empty for them. Every executive
 * dashboard must therefore be gated on the JWT cookie via
 * `/api/corporate/verify` — never on `useAuth()`.
 *
 * Redirect target is `/corporate-access`, which is a PUBLIC route. This is what
 * makes the redirect loop impossible: a denied user always lands on a page that
 * does not itself demand authentication.
 */
export default function CorporateRoleGuard({ allow, children }: CorporateRoleGuardProps) {
  const [state, setState] = useState<'loading' | 'authorized' | 'denied'>('loading');

  // `allow` is normally passed as an inline array literal, so depending on the
  // array identity directly would re-run the effect on every render and loop
  // forever. A joined string key is a stable primitive dependency instead.
  const allowKey = allow.map((role) => role.toUpperCase()).join(',');

  useEffect(() => {
    let cancelled = false;
    const allowedRoles = allowKey.split(',').filter(Boolean);

    async function verify() {
      try {
        const res = await fetch('/api/corporate/verify', {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {
          if (!cancelled) setState('denied');
          return;
        }

        const data = await res.json();
        const role = (data?.user?.role ?? data?.role ?? '').toString().toUpperCase();

        if (data?.authenticated === true && allowedRoles.includes(role)) {
          if (!cancelled) setState('authorized');
          return;
        }

        if (!cancelled) setState('denied');
      } catch {
        if (!cancelled) setState('denied');
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [allowKey]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (state === 'denied') {
    return <Navigate to="/corporate-access" replace />;
  }

  return <>{children}</>;
}
