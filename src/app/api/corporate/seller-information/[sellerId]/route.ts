import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireRole } from '../../../../../middleware/index';
import { classifyDbError } from '../../../../../lib/authUtils';

/**
 * Corporate: detailed seller information view.
 *
 * Returns a single seller's complete profile for the Corporate Dashboard
 * → Sellers detail view. Only FOUNDER, CEO_MD, CHAIRMAN may access.
 * Never exposes passwords, password hashes, OTPs, or auth tokens.
 */
export async function GET(request: any, { params }: { params: { sellerId: string } }) {
  const guard = await requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN']);
  if (guard instanceof NextResponse) return guard;

  const { sellerId } = params;

  try {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            fullName: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: { products: true, orders: true },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            documentType: true,
            generationStatus: true,
            lastDeliveryStatus: true,
            documentVersion: true,
            generatedAt: true,
          },
        },
      },
    });

    if (!seller) {
      return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });
    }

    // Compute login eligibility indicator
    const statusUpper = String(seller.status || '').toUpperCase();
    const verificationUpper = String(seller.verificationStatus || '').toUpperCase();
    const userActive = seller.user?.isActive !== false;

    let loginEligibility: 'allowed' | 'pending' | 'restricted' = 'restricted';
    let loginMessage = '';

    if (statusUpper === 'ACTIVE' || statusUpper === 'APPROVED') {
      loginEligibility = 'allowed';
      loginMessage = 'Login Allowed';
    } else if (statusUpper === 'PENDING') {
      loginEligibility = 'pending';
      loginMessage = 'Pending Approval';
    } else if (statusUpper === 'REJECTED' || statusUpper === 'SUSPENDED' || statusUpper === 'BLOCKED') {
      loginEligibility = 'restricted';
      loginMessage = statusUpper === 'REJECTED' ? 'Rejected' :
        statusUpper === 'SUSPENDED' ? 'Suspended' : 'Blocked';
    }

    return NextResponse.json({
      success: true,
      data: {
        seller: {
          id: seller.id,
          sellerId: seller.sellerId,
          storeName: seller.storeName,
          storeDescription: seller.storeDescription,
          businessType: seller.businessType,
          city: seller.city,
          state: seller.state,
          pincode: seller.pincode,
          address: seller.city && seller.state && seller.pincode
            ? `${seller.city}, ${seller.state} ${seller.pincode}`
            : null,
          gstNumber: seller.gstNumber || null,
          panNumber: seller.panNumber || null,
          bankAccountNo: seller.bankAccountNo || null,
          bankIfsc: seller.bankIfsc || null,
          bankAccountName: seller.bankAccountName || null,
          upiId: seller.upiId || null,
          logoUrl: seller.logoUrl || null,
          bannerUrl: seller.bannerUrl || null,
        },
        owner: {
          name: seller.user?.fullName || '—',
          email: seller.user?.email || '—',
          phone: seller.user?.phone || '—',
          role: seller.user?.role || '—',
          isActive: seller.user?.isActive ?? false,
        },
        verification: {
          emailVerified: seller.emailVerified || false,
          verificationStatus: seller.verificationStatus,
        },
        status: {
          sellerStatus: seller.status,
          accountStatus: seller.user?.isActive === false ? 'INACTIVE' : (seller.status || 'UNKNOWN'),
          approvedAt: seller.updatedAt,
          registrationDate: seller.createdAt,
        },
        loginEligibility: {
          eligible: loginEligibility === 'allowed',
          indicator: loginEligibility, // 'allowed' | 'pending' | 'restricted'
          color: loginEligibility === 'allowed' ? 'green' :
            loginEligibility === 'pending' ? 'yellow' : 'red',
          message: loginMessage,
        },
        metrics: {
          totalProducts: seller._count?.products ?? 0,
          totalOrders: seller._count?.orders ?? 0,
        },
        documents: seller.documents || [],
      },
    });
  } catch (error: any) {
    console.error('[corporate/seller-information] Error:', error);
    const classified = classifyDbError(error);
    if (classified) {
      return NextResponse.json(
        { success: false, error: 'Unable to load seller information. Please try again.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: false, error: 'Failed to load seller information' }, { status: 500 });
  }
}