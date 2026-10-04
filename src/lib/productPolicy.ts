/**
 * SINGLE SOURCE OF TRUTH FOR PRODUCT PUBLICATION.
 *
 * Before this module the publication rule was implicit and duplicated: the seller
 * create route hard-clamped `status` to ['DRAFT','PENDING'], the corporate
 * endpoint wrote 'ACTIVE' on executive approval, and three storefront queries
 * each re-implemented `status = 'ACTIVE'`. Nothing said who may publish, so a
 * valid seller could never publish their own product (it stayed DRAFT forever)
 * while the only way to publish was an executive action.
 *
 * The rule is now stated once, here, and consumed by both the write path and the
 * tests. It deliberately uses ONLY fields that already exist on `Product`
 * (`status`, `approvalStatus`) and `Seller` (`status`, `verificationStatus`) -
 * no duplicate `isPublished` / `publishStatus` / `isActive` columns were added.
 */

/** Seller states that represent a live, approved trading partner. */
export const ACTIVE_SELLER_STATUSES = ['ACTIVE', 'APPROVED'];

/** Seller states that explicitly deny trading. */
export const INELIGIBLE_SELLER_STATUSES = [
  'BLOCKED',
  'SUSPENDED',
  'REJECTED',
  'PENDING',
  'PENDING_VERIFICATION',
  'BANNED',
  'DEACTIVATED',
];

/** Normalise any casing/whitespace from the DB or a form post to UPPER-CASE. */
export function normalizeUpper(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

/**
 * A seller may auto-publish ONLY when every one of these holds:
 *  - the seller row exists
 *  - seller.status is ACTIVE/APPROVED
 *  - seller.status is not one of the explicitly denied states
 *  - seller.verificationStatus is VERIFIED (an unverified seller must not
 *    publish, otherwise a freshly registered seller bypasses email verification)
 *
 * Note the seller.status checks are evaluated independently and BOTH must pass,
 * so contradictory legacy rows fail closed instead of publishing.
 */
export function isSellerEligibleForAutoPublish(
  seller: { status?: string | null; verificationStatus?: string | null } | null | undefined
): boolean {
  if (!seller) return false;

  const status = normalizeUpper(seller.status);
  if (!status) return false;
  if (INELIGIBLE_SELLER_STATUSES.includes(status)) return false;
  if (!ACTIVE_SELLER_STATUSES.includes(status)) return false;

  return normalizeUpper(seller.verificationStatus) === 'VERIFIED';
}

/**
 * Fields every product must carry before it may be published. Used by the write
 * path so an invalid product is rejected at creation instead of going live with
 * a missing price or category and breaking the storefront price/filter UI.
 */
export interface ProductDraftLike {
  title?: unknown;
  category?: unknown;
  price?: unknown;
  stock?: unknown;
}

export function validatePublishableProduct(draft: ProductDraftLike): string[] {
  const errors: string[] = [];

  if (!normalizeUpper(draft.title) && String(draft.title ?? '').trim() === '') {
    errors.push('title is required');
  }

  const price = Number(draft.price);
  if (draft.price === undefined || draft.price === null || draft.price === '' || Number.isNaN(price) || price <= 0) {
    errors.push('price must be a number greater than 0');
  }

  if (String(draft.category ?? '').trim() === '') {
    errors.push('category is required');
  }

  // Stock is allowed to be 0 (a legitimately sold-out product is still a real
  // product and stays listed), but must be a real integer when supplied.
  if (draft.stock !== undefined && draft.stock !== null && draft.stock !== '') {
    const stock = Number(draft.stock);
    if (Number.isNaN(stock) || !Number.isInteger(stock) || stock < 0) {
      errors.push('stock must be an integer greater than or equal to 0');
    }
  }

  return errors;
}

/**
 * Resolve the status a product is stored with, given seller eligibility.
 *
 * Eligible seller  -> ACTIVE + approvalStatus APPROVED (immediately storefront
 *                     visible; no manual corporate approval required).
 * Ineligible seller-> PENDING + approvalStatus null (NOT published; queued for
 *                     review so an admin cannot be tricked into a live listing).
 */
export function resolvePublicationState(
  sellerEligible: boolean
): { status: string; approvalStatus: string | null; autoPublished: boolean } {
  if (sellerEligible) {
    return { status: 'ACTIVE', approvalStatus: 'APPROVED', autoPublished: true };
  }
  return { status: 'PENDING', approvalStatus: null, autoPublished: false };
}

/**
 * THE storefront eligibility rule. Every public query (home, products, search,
 * category, product detail) must use this same predicate so a product cannot be
 * visible on one page and hidden on another.
 *
 * Fail-closed: an unknown or empty status is NOT visible.
 */
export function isProductPubliclyVisible(product: {
  status?: string | null;
  approvalStatus?: string | null;
}): boolean {
  if (!product) return false;
  if (normalizeUpper(product.status) !== 'ACTIVE') return false;

  // approvalStatus is nullable in the schema for pre-existing rows. When present
  // it must agree; when absent we fall back to `status`, which is the canonical
  // publication column and is what the corporate drawer displays.
  const approval = normalizeUpper(product.approvalStatus);
  if (approval && approval !== 'APPROVED') return false;

  return true;
}