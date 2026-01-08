import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate TwiML for voice calls
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'notification';
  const language = searchParams.get('language') || 'en';
  const otp = searchParams.get('otp');
  const message = searchParams.get('message') || '';

  const VOICE_CONFIG: Record<string, { voice: string; language: string }> = {
    en: { voice: 'Polly.Joanna', language: 'en-US' },
    es: { voice: 'Polly.Lupe', language: 'es-US' },
    fr: { voice: 'Polly.Lea', language: 'fr-FR' },
    de: { voice: 'Polly.Vicki', language: 'de-DE' },
    pt: { voice: 'Polly.Camila', language: 'pt-BR' },
    ja: { voice: 'Polly.Mizuki', language: 'ja-JP' },
    ko: { voice: 'Polly.Seoyeon', language: 'ko-KR' },
    zh: { voice: 'Polly.Zhiyu', language: 'cmn-CN' },
  };

  const config = VOICE_CONFIG[language] || VOICE_CONFIG.en;

  let twiml: string;

  if (type === 'otp' && otp) {
    const spokenOTP = otp.split('').join('. ');
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${config.voice}" language="${config.language}">
    Hello, this is CareOS. Your verification code is: ${spokenOTP}.
    I repeat: ${spokenOTP}.
    This code expires in 5 minutes. Goodbye.
  </Say>
</Response>`;
  } else {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${config.voice}" language="${config.language}">
    ${decodeURIComponent(message)}
  </Say>
</Response>`;
  }

  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

