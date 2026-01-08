import { prisma } from './prisma';
import { sendSMS, sendWhatsApp, lookupPhoneNumber } from './twilio';
import { getLocalizedMessage } from './language';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Handle 5-step SMS onboarding flow
 */
export async function handleOnboarding(
  user: { id: string; phone: string | null; language: string; onboardingStep: string | null; status: string },
  message: string,
  channel: 'sms' | 'whatsapp',
  messageSid: string | null,
  ipAddress?: string
): Promise<string> {
  const step = user.onboardingStep || 'consent';
  const normalizedMessage = message.trim().toUpperCase();
  const language = user.language || 'en';

  switch (step) {
    case 'consent': {
      // Step 1: User sent initial message, we sent consent. Now waiting for YES
      if (normalizedMessage === 'YES' || normalizedMessage === 'SÍ' || normalizedMessage === 'OUI' || normalizedMessage === 'JA' || normalizedMessage === 'SIM') {
        // Log consent
        const carrierInfo = user.phone ? await lookupPhoneNumber(user.phone) : null;
        
        await prisma.consentRecord.create({
          data: {
            userId: user.id,
            phone: user.phone || '',
            consentType: 'double_opt_in',
            consentLanguage: getLocalizedMessage('consent', language),
            userResponse: message,
            language: user.language,
            channel,
            carrierName: carrierInfo?.carrier?.name || undefined,
            twilioMessageSid: messageSid || undefined,
            ipAddress,
          },
        });

        // Move to step 2: Ask for name
        await prisma.user.update({
          where: { id: user.id },
          data: { onboardingStep: 'name' },
        });

        return getLocalizedMessage('name_prompt', language) || `What's your first name?`;
      }
      return getLocalizedMessage('consent', language);
    }

    case 'name': {
      // Step 2: Store name, ask for email
      const name = message.trim();
      if (name.length < 2) {
        return getLocalizedMessage('name_invalid', language) || 'Please provide a valid name (at least 2 characters).';
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { name, onboardingStep: 'email' },
      });

      return getLocalizedMessage('email_prompt', language) || `Thanks ${name}! What's your email address? (for account recovery)`;
    }

    case 'email': {
      // Step 3: Validate and store email
      const email = message.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(email)) {
        return getLocalizedMessage('email_invalid', language) || 'Please provide a valid email address.';
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== user.id) {
        return getLocalizedMessage('email_taken', language) || 'This email is already registered. Please use a different one.';
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { email, onboardingStep: 'password' },
      });

      return getLocalizedMessage('password_prompt', language) || 'Create a password (at least 6 characters):';
    }

    case 'password': {
      // Step 4: Validate and hash password
      const password = message.trim();
      if (password.length < 6) {
        return getLocalizedMessage('password_invalid', language) || 'Password must be at least 6 characters. Please try again:';
      }

      const passwordHash = await bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: passwordHash,
          onboardingStep: 'complete',
          status: 'active',
        },
      });

      return getLocalizedMessage('welcome', language);
    }

    default:
      return getLocalizedMessage('help', language);
  }
}

/**
 * Send SMS response
 */
export async function sendResponse(
  phone: string,
  channel: 'sms' | 'whatsapp',
  message: string
): Promise<string | null> {
  if (channel === 'whatsapp') {
    return await sendWhatsApp(phone, message);
  }
  return await sendSMS(phone, message);
}

/**
 * Handle opt-out
 */
export async function handleOptOut(
  phone: string,
  channel: 'sms' | 'whatsapp',
  messageSid: string | null
): Promise<void> {
  // Add to suppression list
  await prisma.suppressionList.upsert({
    where: { phone },
    create: {
      phone,
      reason: 'user_opted_out',
      channel,
    },
    update: {
      reason: 'user_opted_out',
      channel,
    },
  });

  // Update user status if exists
  const user = await prisma.user.findUnique({ where: { phone } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'opted_out' },
    });

    // Log consent record
    await prisma.consentRecord.create({
      data: {
        userId: user.id,
        phone,
        consentType: 'opt_out',
        consentLanguage: 'STOP keyword',
        userResponse: 'STOP',
        language: user.language,
        channel,
        twilioMessageSid: messageSid || undefined,
      },
    });
  }
}

/**
 * Hash phone number for analytics (SHA-256 with salt)
 */
export function hashPhone(phone: string): string {
  const salt = process.env.PHONE_HASH_SALT || 'default-salt-change-in-production';
  return createHash('sha256').update(phone + salt).digest('hex');
}

