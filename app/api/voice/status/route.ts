import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Handle voice call status webhook from Twilio
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const body = Object.fromEntries(formData.entries()) as Record<string, string>;

    const callSid = body.CallSid;
    const callStatus = body.CallStatus; // initiated, ringing, in-progress, completed, busy, failed, no-answer
    const answeredBy = body.AnsweredBy; // human, machine_start, machine_end_beep
    const callDuration = body.CallDuration || '0';

    if (!callSid) {
      return new NextResponse('Missing CallSid', { status: 400 });
    }

    // Update voice call record
    await prisma.voiceCall.update({
      where: { callSid },
      data: {
        status: callStatus,
        answeredBy: answeredBy || undefined,
        voicemailDetected: answeredBy?.includes('machine') || false,
        duration: parseInt(callDuration) || undefined,
        completedAt: callStatus === 'completed' || callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer' ? new Date() : undefined,
      },
    });

    return new NextResponse('OK');
  } catch (error) {
    console.error('Error processing voice status:', error);
    return new NextResponse('Error', { status: 500 });
  }
}

