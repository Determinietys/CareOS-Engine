import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get vendor profile
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { vendor: true, subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If no vendor profile exists, create one
    if (!user.vendor) {
      const vendor = await prisma.vendor.create({
        data: {
          userId: user.id,
          businessName: user.name || 'My Business',
          category: 'general',
          subscriptionTier: user.subscription?.tier || 'free',
        },
      });

      return NextResponse.json({
        success: true,
        vendor: {
          id: vendor.id,
          businessName: vendor.businessName,
          category: vendor.category,
          subscriptionTier: vendor.subscriptionTier,
          verified: vendor.verified,
          totalLeads: vendor.totalLeads,
          acceptedLeads: vendor.acceptedLeads,
        },
      });
    }

    return NextResponse.json({
      success: true,
      vendor: {
        id: user.vendor.id,
        businessName: user.vendor.businessName,
        category: user.vendor.category,
        subscriptionTier: user.vendor.subscriptionTier,
        verified: user.vendor.verified,
        totalLeads: user.vendor.totalLeads,
        acceptedLeads: user.vendor.acceptedLeads,
      },
    });
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

