import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Helper to resolve user ID or seller profile ID to seller profile ID
async function resolveSeller(id: string | null) {
  if (!id) return null;
  let seller = await prisma.seller.findFirst({
    where: {
      OR: [
        { id: id },
        { userId: id }
      ]
    },
    include: {
      pickupAddress: true,
      user: true
    }
  });
  if (!seller) {
    seller = await prisma.seller.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        pickupAddress: true,
        user: true
      }
    });
  }
  return seller;
}

// GET /api/seller/store-settings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerIdParam = searchParams.get('sellerId') || searchParams.get('userId');

    if (!sellerIdParam) {
      return NextResponse.json({ error: 'sellerId or userId query parameter is required' }, { status: 400 });
    }

    const seller = await resolveSeller(sellerIdParam);
    if (!seller) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    const formattedSeller = {
      id: seller.id,
      user_id: seller.userId,
      store_name: seller.storeName,
      store_description: seller.storeDescription,
      gst_number: seller.gstNumber,
      pan_number: seller.panNumber,
      bank_account_number: seller.bankAccountNo,
      bank_ifsc: seller.bankIfsc,
      bank_account_name: seller.bankAccountName,
      store_logo_url: seller.logoUrl,
      store_banner_url: seller.bannerUrl,
      business_type: seller.businessType,
      address: seller.pickupAddress?.addressLine1 || '',
      city: seller.pickupAddress?.city || seller.city || '',
      state: seller.pickupAddress?.state || seller.state || '',
      pincode: seller.pickupAddress?.pincode || seller.pincode || '',
      commission_rate: seller.commissionRate,
      status: seller.status.toLowerCase(),
      created_at: seller.createdAt,
      updated_at: seller.updatedAt
    };

    return NextResponse.json({ success: true, data: formattedSeller });
  } catch (error: any) {
    console.error('Error fetching store settings:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/seller/store-settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      sellerId: sellerIdParam,
      userId,
      store_name,
      storeDescription, // camelCase or snake_case inputs
      store_description,
      businessType,
      business_type,
      gstNumber,
      gst_number,
      panNumber,
      pan_number,
      bankAccountNumber,
      bank_account_number,
      bankIfsc,
      bank_ifsc,
      bankAccountName,
      bank_account_name,
      address,
      city,
      state,
      pincode,
      logoUrl,
      store_logo_url,
      bannerUrl,
      store_banner_url
    } = body;

    const idToResolve = sellerIdParam || userId;
    if (!idToResolve) {
      return NextResponse.json({ error: 'sellerId or userId is required' }, { status: 400 });
    }

    const seller = await resolveSeller(idToResolve);
    if (!seller) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    const storeNameVal = store_name !== undefined ? store_name : seller.storeName;
    const storeDescVal = store_description !== undefined ? store_description : (storeDescription !== undefined ? storeDescription : seller.storeDescription);
    const bizTypeVal = business_type !== undefined ? business_type : (businessType !== undefined ? businessType : seller.businessType);
    const gstVal = gst_number !== undefined ? gst_number : (gstNumber !== undefined ? gstNumber : seller.gstNumber);
    const panVal = pan_number !== undefined ? pan_number : (panNumber !== undefined ? panNumber : seller.panNumber);
    
    const bankAcNoVal = bank_account_number !== undefined ? bank_account_number : (bankAccountNumber !== undefined ? bankAccountNumber : seller.bankAccountNo);
    const bankIfscVal = bank_ifsc !== undefined ? bank_ifsc : (bankIfsc !== undefined ? bankIfsc : seller.bankIfsc);
    const bankAcNameVal = bank_account_name !== undefined ? bank_account_name : (bankAccountName !== undefined ? bankAccountName : seller.bankAccountName);
    
    const logoVal = store_logo_url !== undefined ? store_logo_url : (logoUrl !== undefined ? logoUrl : seller.logoUrl);
    const bannerVal = store_banner_url !== undefined ? store_banner_url : (bannerUrl !== undefined ? bannerUrl : seller.bannerUrl);

    // Update Seller Info
    const updatedSeller = await prisma.seller.update({
      where: { id: seller.id },
      data: {
        storeName: storeNameVal,
        storeDescription: storeDescVal,
        businessType: bizTypeVal,
        gstNumber: gstVal,
        panNumber: panVal,
        bankAccountNo: bankAcNoVal,
        bankIfsc: bankIfscVal,
        bankAccountName: bankAcNameVal,
        logoUrl: logoVal,
        bannerUrl: bannerVal
      }
    });

    // Update or Create Pickup Address if address details are sent
    if (address !== undefined || city !== undefined || state !== undefined || pincode !== undefined) {
      const addressLine1 = address !== undefined ? address : (seller.pickupAddress?.addressLine1 || '');
      const cityVal = city !== undefined ? city : (seller.pickupAddress?.city || seller.city || '');
      const stateVal = state !== undefined ? state : (seller.pickupAddress?.state || seller.state || '');
      const pinVal = pincode !== undefined ? pincode : (seller.pickupAddress?.pincode || seller.pincode || '');

      await prisma.pickupAddress.upsert({
        where: { sellerId: seller.id },
        update: {
          addressLine1,
          city: cityVal,
          state: stateVal,
          pincode: pinVal
        },
        create: {
          sellerId: seller.id,
          storeName: storeNameVal,
          contactName: seller.user?.fullName || 'Store Contact',
          phone: seller.user?.phone || '9999999999',
          email: seller.user?.email || 'merchant@example.com',
          addressLine1,
          city: cityVal,
          state: stateVal,
          pincode: pinVal
        }
      });
    }

    return NextResponse.json({ success: true, data: updatedSeller });
  } catch (error: any) {
    console.error('Error updating store settings:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
