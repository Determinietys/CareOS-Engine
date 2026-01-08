import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get leads for vendor based on subscription tier
 */
export async function GET(req: NextRequest) {
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

    // Ensure vendor profile exists
    if (!user.vendor) {
      await prisma.vendor.create({
        data: {
          userId: user.id,
          businessName: user.name || 'My Business',
          category: 'general',
          subscriptionTier: user.subscription?.tier || 'free',
        },
      });
    }

    const vendor = user.vendor!;
    const subscriptionTier = user.subscription?.tier || 'free';

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'available';
    const query = searchParams.get('q') || '';

    // Build query based on subscription tier
    const where: any = {
      acceptedByVendorId: null, // Not yet accepted
    };

    // Filter by status
    if (status === 'available') {
      where.status = { in: ['consented', 'captured'] };
    } else if (status === 'accepted') {
      where.acceptedByVendorId = vendor.id;
      where.status = 'accepted';
    }

    // Filter by vendor category if not enterprise
    if (subscriptionTier !== 'enterprise' && vendor.category !== 'general') {
      where.category = vendor.category;
    }

    // Search query
    if (query) {
      where.OR = [
        { needDescription: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Limit based on tier
    const take = subscriptionTier === 'enterprise' ? 1000 : subscriptionTier === 'premium' ? 100 : subscriptionTier === 'basic' ? 20 : 5;

    const leads = await prisma.lead.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return NextResponse.json({
      success: true,
      leads: leads.map((lead) => ({
        id: lead.id,
        category: lead.category,
        needDescription: lead.needDescription,
        locationState: lead.locationState,
        urgency: lead.urgency,
        status: lead.status,
        leadValue: lead.leadValue ? Number(lead.leadValue) : null,
        createdAt: lead.createdAt,
        user: lead.user,
      })),
    });
  } catch (error) {
    console.error('Error fetching vendor leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

