import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getLeadPartner } from '@/lib/leads';
import { sendSMS, sendWhatsApp } from '@/lib/twilio';

/**
 * Distribute lead to partner
 * TODO: Integrate with partner APIs/webhooks
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user has admin/partner role

    const lead = await prisma.lead.findUnique({
      where: { id: params.leadId },
      include: {
        user: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.status === 'distributed') {
      return NextResponse.json({ error: 'Lead already distributed' }, { status: 400 });
    }

    if (!lead.consentGiven) {
      return NextResponse.json({ error: 'Lead consent not given' }, { status: 400 });
    }

    const partner = getLeadPartner(lead.category);

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // TODO: Send lead to partner via API/webhook
    // For now, just update status and notify user
    await prisma.lead.update({
      where: { id: params.leadId },
      data: {
        status: 'distributed',
      },
    });

    // Notify user if they have a phone number
    if (lead.user?.phone && partner.url) {
      const message = `Great! We've connected you with ${partner.name}. Visit: ${partner.url}`;
      
      if (lead.user.preferredChannel === 'whatsapp') {
        await sendWhatsApp(lead.user.phone, message);
      } else {
        await sendSMS(lead.user.phone, message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Lead distributed successfully',
    });
  } catch (error) {
    console.error('Error distributing lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

