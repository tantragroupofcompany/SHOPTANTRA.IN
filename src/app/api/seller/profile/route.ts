import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword, verifyPassword } from '../../../../lib/authUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!dbUser) {
      dbUser = await prisma.user.findFirst({
        where: { role: 'SELLER' }
      });
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const sellerProfile = await prisma.seller.findUnique({
      where: { userId: dbUser.id }
    });

    const formattedProfile = {
      id: dbUser.id,
      user_id: dbUser.id,
      email: dbUser.email,
      full_name: dbUser.fullName || '',
      phone: dbUser.phone || '',
      role: dbUser.role.toLowerCase(),
      has_seller_profile: !!sellerProfile,
      logo_url: sellerProfile?.logoUrl || null,
      created_at: dbUser.createdAt,
      updated_at: dbUser.updatedAt
    };

    return NextResponse.json({ success: true, data: formattedProfile });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, full_name, phone, current_password, new_password } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!dbUser) {
      dbUser = await prisma.user.findFirst({
        where: { role: 'SELLER' }
      });
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (full_name !== undefined) updateData.fullName = full_name;
    if (phone !== undefined) updateData.phone = phone;

    // Handle password change request
    if (new_password) {
      if (!current_password) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
      }

      if (!verifyPassword(current_password, dbUser.password)) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
      }

      if (new_password.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      updateData.password = hashPassword(new_password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    const sellerProfile = await prisma.seller.findUnique({
      where: { userId: updatedUser.id }
    });

    const formattedProfile = {
      id: updatedUser.id,
      user_id: updatedUser.id,
      email: updatedUser.email,
      full_name: updatedUser.fullName || '',
      phone: updatedUser.phone || '',
      role: updatedUser.role.toLowerCase(),
      has_seller_profile: !!sellerProfile,
      logo_url: sellerProfile?.logoUrl || null,
      created_at: updatedUser.createdAt,
      updated_at: updatedUser.updatedAt
    };

    return NextResponse.json({ success: true, data: formattedProfile });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
