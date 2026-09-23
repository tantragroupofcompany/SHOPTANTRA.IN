import CorporateRoleGuard from './CorporateRoleGuard';

/**
 * CEO & MD dashboard gate.
 *
 * The CEO & Managing Director is a single combined role stored as CEO_MD -
 * there is no separate CEO or MD row in the database. The legacy CEO alias is
 * canonicalised to CEO_MD server-side by /api/corporate/verify.
 */
export default function CEOGuard({ children }: { children: React.ReactNode }) {
  return <CorporateRoleGuard allow={['CEO_MD']}>{children}</CorporateRoleGuard>;
}