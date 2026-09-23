import CorporateRoleGuard from './CorporateRoleGuard';

/**
 * Chairman dashboard gate.
 *
 * Chairman accounts sign in through /api/corporate/login (JWT cookie), so this
 * must verify that cookie - NOT the Supabase useAuth() context, which is always
 * empty for executive users and previously bounced them to /login.
 */
export default function ChairmanGuard({ children }: { children: React.ReactNode }) {
  return <CorporateRoleGuard allow={['CHAIRMAN']}>{children}</CorporateRoleGuard>;
}