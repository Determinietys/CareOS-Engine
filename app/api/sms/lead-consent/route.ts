import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLeadPartner } from '@/lib/leads';
import { sendSMS, sendWhatsApp } from '@/lib/twilio';

/**
 * Handle lead consent response (YES/NO)
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, channel, response, leadId } = await req.json();

    if (!phone || !channel || !response || !leadId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const normalizedResponse = response.toUpperCase().trim();
    const isConsent = normalizedResponse === 'YES' || normalizedResponse === 'SÍ' || normalizedResponse === 'OUI';

    if (isConsent) {
      // Update lead with consent
      const partner = getLeadPartner(lead.category);
      
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          consentGiven: true,
          consentTimestamp: new Date(),
          status: 'consented',
        },
      });

      // TODO: Distribute lead to partner (webhook, API call, etc.)
      // For now, send partner link to user
      if (partner?.url) {
        const message = `Great! Here's the link to ${partner.name}: ${partner.url}`;
        
        if (channel === 'whatsapp') {
          await sendWhatsApp(phone, message);
        } else {
          await sendSMS(phone, message);
        }
      }

      return NextResponse.json({ success: true, status: 'consented' });
    } else {
      // User declined
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'declined',
        },
      });

      // Store as unmatched demand for product intelligence
      await prisma.unmatchedDemand.upsert({
        where: { id: leadId }, // This won't work, need to fix
        create: {
          needDescription: lead.needDescription,
          categoryGuess: lead.category,
          frequency: 1,
          sampleMessages: [lead.needDescription],
        },
        update: {
          frequency: { increment: 1 },
          lastSeen: new Date(),
          sampleMessages: {
            push: lead.needDescription,
          },
        },
      });

      return NextResponse.json({ success: true, status: 'declined' });
    }
  } catch (error) {
    console.error('Error handling lead consent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

