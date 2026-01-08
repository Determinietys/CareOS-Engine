import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Search leads for Helper Engine
 * Accessible to all authenticated users (vendors can search for opportunities)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || null;
    const location = searchParams.get('location') || null;
    const country = searchParams.get('country') || null;
    const city = searchParams.get('city') || null;

    // Build search query
    const where: any = {
      status: {
        in: ['consented', 'captured'], // Only show available leads
      },
      acceptedByVendorId: null, // Not yet accepted
    };

    if (category) {
      where.category = category;
    }

    if (location) {
      where.locationState = location;
    }

    if (country) {
      where.country = country;
    }

    if (city) {
      where.city = city;
    }

    if (query) {
      where.OR = [
        { needDescription: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { partnerName: { contains: query, mode: 'insensitive' } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      leads: leads.map((lead) => ({
        id: lead.id,
        category: lead.category,
        needDescription: lead.needDescription,
        locationState: lead.locationState,
        country: lead.country,
        countryName: lead.countryName,
        city: lead.city,
        region: lead.region,
        budget: lead.budget ? Number(lead.budget) : null,
        budgetUSD: lead.budgetUSD ? Number(lead.budgetUSD) : null,
        currency: lead.currency,
        urgency: lead.urgency,
        status: lead.status,
        leadValue: lead.leadValue ? Number(lead.leadValue) : null,
        createdAt: lead.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error searching leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

