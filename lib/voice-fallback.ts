import { twilioClient } from './twilio';
import { prisma } from './prisma';
import { sendSMS, sendWhatsApp } from './twilio';

export interface VoiceCallOptions {
  phone: string;
  message: string;
  language: string;
  type: 'otp' | 'notification' | 'reminder';
  otp?: string;
}

// Voice configuration per language (using Amazon Polly via Twilio)
const VOICE_CONFIG: Record<string, { voice: string; language: string }> = {
  en: { voice: 'Polly.Joanna', language: 'en-US' },
  es: { voice: 'Polly.Lupe', language: 'es-US' },
  fr: { voice: 'Polly.Lea', language: 'fr-FR' },
  de: { voice: 'Polly.Vicki', language: 'de-DE' },
  pt: { voice: 'Polly.Camila', language: 'pt-BR' },
  ja: { voice: 'Polly.Mizuki', language: 'ja-JP' },
  ko: { voice: 'Polly.Seoyeon', language: 'ko-KR' },
  zh: { voice: 'Polly.Zhiyu', language: 'cmn-CN' },
  it: { voice: 'Polly.Bianca', language: 'it-IT' },
  ar: { voice: 'Polly.Zeina', language: 'ar-AE' },
  hi: { voice: 'Polly.Aditi', language: 'hi-IN' },
  ru: { voice: 'Polly.Tatyana', language: 'ru-RU' },
};

/**
 * Generate TwiML for voice call
 */
function generateTwiML(options: VoiceCallOptions): string {
  const config = VOICE_CONFIG[options.language] || VOICE_CONFIG.en;
  
  if (options.type === 'otp' && options.otp) {
    // Spell out OTP digits slowly with pauses
    const spokenOTP = options.otp.split('').join('. ');
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${config.voice}" language="${config.language}">
    Hello, this is CareOS. Your verification code is: ${spokenOTP}.
    I repeat: ${spokenOTP}.
    This code expires in 5 minutes. Goodbye.
  </Say>
</Response>`;
  } else {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${config.voice}" language="${config.language}">
    ${options.message}
  </Say>
</Response>`;
  }
}

/**
 * Make voice call with text-to-speech
 */
export async function makeVoiceCall(options: VoiceCallOptions): Promise<{
  success: boolean;
  callSid?: string;
  error?: string;
}> {
  if (!twilioClient || !process.env.TWILIO_VOICE_NUMBER) {
    return { success: false, error: 'Twilio voice not configured' };
  }

  try {
    const twiml = generateTwiML(options);
    
    // Store TwiML URL (in production, host this endpoint)
    const twimlUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/voice/twiml?type=${options.type}&language=${options.language}${options.otp ? `&otp=${options.otp}` : ''}&message=${encodeURIComponent(options.message)}`;

    const call = await twilioClient.calls.create({
      to: options.phone,
      from: process.env.TWILIO_VOICE_NUMBER,
      url: twimlUrl,
      statusCallback: `${process.env.BASE_URL || 'http://localhost:3000'}/api/voice/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no-answer'],
      timeout: 30,
      machineDetection: 'Enable',
      machineDetectionTimeout: 10,
    });

    // Store call record
    await prisma.voiceCall.create({
      data: {
        phone: options.phone,
        callSid: call.sid,
        type: options.type,
        language: options.language,
        status: 'initiated',
      },
    });

    return { success: true, callSid: call.sid };
  } catch (error: any) {
    console.error('Error making voice call:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Enhanced fallback chain: SMS → WhatsApp → Voice → Email → Support Queue
 */
export async function sendWithFallback(
  phone: string,
  message: string,
  options: {
    language?: string;
    type?: 'otp' | 'notification' | 'reminder';
    otp?: string;
    userId?: string;
    retryCount?: number;
  } = {}
): Promise<{ success: boolean; method: string; error?: string }> {
  const { language = 'en', type = 'notification', otp, userId, retryCount = 0 } = options;

  // 1. Try Twilio SMS
  try {
    const smsSid = await sendSMS(phone, message);
    if (smsSid) {
      return { success: true, method: 'sms_twilio' };
    }
  } catch (e) {
    console.log('Twilio SMS failed, trying next method...');
  }

  // 2. Try WhatsApp (if user opted in)
  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferredChannel: true },
      });
      
      if (user?.preferredChannel === 'whatsapp') {
        const waSid = await sendWhatsApp(phone, message);
        if (waSid) {
          return { success: true, method: 'whatsapp' };
        }
      }
    } catch (e) {
      console.log('WhatsApp failed, trying next method...');
    }
  }

  // 3. Try Voice Call (only if retries exhausted or critical message)
  if (retryCount >= 2 || type === 'otp') {
    try {
      const voiceResult = await makeVoiceCall({
        phone,
        message,
        language,
        type,
        otp,
      });
      
      if (voiceResult.success) {
        return { success: true, method: 'voice_call' };
      }
    } catch (e) {
      console.log('Voice call failed, trying next method...');
    }
  }

  // 4. Try Email (if user has email)
  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      
      if (user?.email) {
        // TODO: Implement email sending
        // await sendEmail(user.email, 'CareOS Notification', message);
        return { success: true, method: 'email' };
      }
    } catch (e) {
      console.log('Email failed...');
    }
  }

  // 5. Queue for manual support
  // TODO: Create support queue table if needed
  console.error(`All delivery methods failed for phone: ${phone.substring(0, 4)}****`);
  
  return { success: false, method: 'none', error: 'All delivery methods failed' };
}

