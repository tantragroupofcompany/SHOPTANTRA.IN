import CorporateRoleGuard from './CorporateRoleGuard';

/**
 * Founder dashboard gate.
 *
 * Founder accounts sign in through /api/corporate/login (JWT cookie), so this
 * must verify that cookie - NOT the Supabase useAuth() context, which is always
 * empty for executive users and previously bounced them to /login.
 */
export default function FounderGuard({ children }: { children: React.ReactNode }) {
  return <CorporateRoleGuard allow={['FOUNDER']}>{children}</CorporateRoleGuard>;
}