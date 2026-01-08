import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get leads for admin/business portal
 * TODO: Add role-based access control (admin/partner roles)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user has admin/partner role
    // For now, allow any authenticated user (should be restricted in production)

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';

    const where: any = {};
    if (status !== 'all') {
      where.status = status;
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
      take: 100,
    });

    // Calculate stats
    const allLeads = await prisma.lead.findMany({});
    const stats = {
      total: allLeads.length,
      totalValue: allLeads.reduce((sum, lead) => sum + (Number(lead.leadValue) || 0), 0),
      consented: allLeads.filter((l) => l.consentGiven).length,
      distributed: allLeads.filter((l) => l.status === 'distributed').length,
    };

    return NextResponse.json({
      success: true,
      leads,
      stats,
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

