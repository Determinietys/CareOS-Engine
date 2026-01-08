import twilio from 'twilio';

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.warn('Twilio credentials not configured. SMS features will be disabled.');
}

export const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
export const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '';
export const TWILIO_MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID || '';

/**
 * Send SMS message
 */
export async function sendSMS(
  to: string,
  body: string,
  options?: {
    mediaUrl?: string;
    statusCallback?: string;
  }
): Promise<string | null> {
  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    console.error('Twilio not configured');
    return null;
  }

  try {
    const message = await twilioClient.messages.create({
      to,
      from: TWILIO_PHONE_NUMBER,
      body,
      mediaUrl: options?.mediaUrl ? [options.mediaUrl] : undefined,
      statusCallback: options?.statusCallback,
    });

    return message.sid;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return null;
  }
}

/**
 * Send WhatsApp message
 */
export async function sendWhatsApp(
  to: string,
  body: string,
  options?: {
    mediaUrl?: string;
    statusCallback?: string;
  }
): Promise<string | null> {
  if (!twilioClient || !TWILIO_WHATSAPP_NUMBER) {
    console.error('Twilio WhatsApp not configured');
    return null;
  }

  try {
    const message = await twilioClient.messages.create({
      to: `whatsapp:${to}`,
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      body,
      mediaUrl: options?.mediaUrl ? [options.mediaUrl] : undefined,
      statusCallback: options?.statusCallback,
    });

    return message.sid;
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return null;
  }
}

/**
 * Validate Twilio webhook signature
 */
export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  if (!process.env.TWILIO_AUTH_TOKEN) {
    return false;
  }

  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    signature,
    url,
    params
  );
}

/**
 * Get carrier information from phone number
 */
export async function lookupPhoneNumber(phone: string): Promise<{
  carrier?: { name?: string; type?: string };
  countryCode?: string;
} | null> {
  if (!twilioClient) {
    return null;
  }

  try {
    const lookup = await twilioClient.lookups.v2.phoneNumbers(phone).fetch();
    return {
      carrier: lookup.carrier,
      countryCode: lookup.countryCode,
    };
  } catch (error) {
    console.error('Error looking up phone number:', error);
    return null;
  }
}

