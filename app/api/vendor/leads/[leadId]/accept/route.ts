import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCalendarInvite, generateGoogleCalendarUrl, generateOutlookCalendarUrl } from '@/lib/calendar';
import { sendSMS, sendWhatsApp } from '@/lib/twilio';

/**
 * Accept lead and generate calendar invite
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

    const { meetingDate, meetingTime } = await req.json();

    if (!meetingDate || !meetingTime) {
      return NextResponse.json(
        { error: 'Meeting date and time are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { vendor: true, subscription: true },
    });

    if (!user || !user.vendor) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: params.leadId },
      include: { user: true },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.acceptedByVendorId) {
      return NextResponse.json({ error: 'Lead already accepted' }, { status: 400 });
    }

    // Check subscription tier limits
    const subscriptionTier = user.subscription?.tier || 'free';
    const tierLimits: Record<string, number> = {
      free: 0,
      basic: 20,
      premium: 100,
      enterprise: -1, // unlimited
    };

    const limit = tierLimits[subscriptionTier] || 0;
    if (limit !== -1 && user.vendor.acceptedLeads >= limit) {
      return NextResponse.json(
        { error: 'Lead acceptance limit reached. Please upgrade your subscription.' },
        { status: 403 }
      );
    }

    // Parse meeting date/time
    const meetingDateTime = new Date(`${meetingDate}T${meetingTime}`);
    const meetingEnd = new Date(meetingDateTime.getTime() + 30 * 60 * 1000); // 30 min default

    // Generate calendar invite
    const calendarEvent = {
      title: `CareOS Lead Meeting: ${lead.category.replace('_', ' ')}`,
      description: `Meeting to discuss: ${lead.needDescription}\n\nLead ID: ${lead.id}`,
      start: meetingDateTime,
      end: meetingEnd,
      location: 'Virtual Meeting',
      attendees: [
        {
          name: user.vendor.businessName,
          email: user.email || '',
        },
        ...(lead.user?.email
          ? [
              {
                name: lead.user.name || 'Lead User',
                email: lead.user.email,
              },
            ]
          : []),
      ],
    };

    const { fileContent, fileName } = await generateCalendarInvite(calendarEvent);
    const googleCalendarUrl = generateGoogleCalendarUrl(calendarEvent);
    const outlookCalendarUrl = generateOutlookCalendarUrl(calendarEvent);

    // Update lead
    await prisma.lead.update({
      where: { id: params.leadId },
      data: {
        status: 'accepted',
        acceptedByVendorId: user.vendor.id,
        acceptedAt: new Date(),
        meetingScheduledAt: meetingDateTime,
        calendarInviteUrl: googleCalendarUrl,
      },
    });

    // Update vendor stats
    await prisma.vendor.update({
      where: { id: user.vendor.id },
      data: {
        acceptedLeads: { increment: 1 },
        totalLeads: { increment: 1 },
      },
    });

    // Notify user via SMS/WhatsApp if they have a phone
    if (lead.user?.phone) {
      const message = `Great news! ${user.vendor.businessName} has accepted your lead and scheduled a meeting for ${meetingDateTime.toLocaleString()}. Add to calendar: ${googleCalendarUrl}`;
      
      if (lead.user.preferredChannel === 'whatsapp') {
        await sendWhatsApp(lead.user.phone, message);
      } else {
        await sendSMS(lead.user.phone, message);
      }
    }

    return NextResponse.json({
      success: true,
      calendarInvite: {
        ics: fileContent,
        fileName,
        googleUrl: googleCalendarUrl,
        outlookUrl: outlookCalendarUrl,
      },
      meetingDateTime: meetingDateTime.toISOString(),
    });
  } catch (error) {
    console.error('Error accepting lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

