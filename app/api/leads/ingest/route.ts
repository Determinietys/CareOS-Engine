import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt, hashPhone } from '@/lib/encryption';
import {
  mapToHealthcareCategory,
  getReferralConsentLanguage,
  sendWelcomeSMS,
} from '@/lib/partner-integration';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { withErrorHandling } from '@/lib/api/error-handler';
import { InboundLeadSchema, type InboundLead } from '@/lib/validations/partner-lead';

// Partner API keys (store in env)
const PARTNER_API_KEYS: Record<string, string | undefined> = {
  businessos: process.env.BUSINESSOS_API_KEY,
  // Add more partners as needed
};

/**
 * API endpoint to receive leads from BusinessOS (or other partners)
 * POST /api/leads/ingest
 * 
 * Security:
 * - API key authentication
 * - Rate limiting (100 req/min per partner)
 * - Input validation with Zod
 * - Phone number encryption verification
 * - Consent verification
 */
async function handler(req: NextRequest) {
  // ═══════════════════════════════════════════════════════════════
  // 1. VERIFY API KEY
  // ═══════════════════════════════════════════════════════════════
  const apiKey = req.headers.get('X-API-Key');
  const platform = req.headers.get('X-Platform');

  if (!platform || !apiKey) {
    return NextResponse.json(
      { error: 'Missing authentication headers', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  const expectedKey = PARTNER_API_KEYS[platform.toLowerCase()];
  if (!expectedKey || apiKey !== expectedKey) {
    console.error(`Invalid API key for platform: ${platform}`);
    return NextResponse.json(
      { error: 'Invalid API key', code: 'AUTH_INVALID' },
      { status: 401 }
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. PARSE AND VALIDATE LEAD (with Zod)
  // ═══════════════════════════════════════════════════════════════
  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  // Validate with Zod schema
  const validationResult = InboundLeadSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.errors,
      },
      { status: 400 }
    );
  }

  const lead: InboundLead = validationResult.data;

  // Additional business logic validation
  if (!lead.user_consent) {
    return NextResponse.json(
      { error: 'User consent required', code: 'CONSENT_REQUIRED' },
      { status: 400 }
    );
  }

    // ═══════════════════════════════════════════════════════════════
    // 3. DECRYPT PHONE NUMBER
    // ═══════════════════════════════════════════════════════════════
    let userPhone: string;
    try {
      const privateKey = process.env.CAREOS_PRIVATE_KEY;
      if (!privateKey) {
        console.error('CAREOS_PRIVATE_KEY not configured');
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        );
      }
      userPhone = decrypt(lead.user_phone_encrypted, privateKey);
    } catch (error) {
      console.error('Failed to decrypt phone:', error);
      return NextResponse.json(
        { error: 'Failed to decrypt user data' },
        { status: 400 }
      );
    }

    // Verify phone hash matches
    const expectedHash = hashPhone(userPhone);
    if (lead.user_phone_hash !== expectedHash) {
      console.error('Phone hash mismatch');
      return NextResponse.json(
        { error: 'Data integrity check failed' },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. FIND OR CREATE USER
    // ═══════════════════════════════════════════════════════════════
    let user = await prisma.user.findUnique({
      where: { phone: userPhone },
    });

    const isNewUser = !user;

    if (!user) {
      // Create new user from referral
      user = await prisma.user.create({
        data: {
          phone: userPhone,
          name: lead.user_name || null,
          language: lead.user_language || 'en',
          status: 'referred', // Special status for referred users
          source: `${platform}_referral`,
          sourceLeadId: lead.source_conversation_id,
          locationState: lead.user_location_state || null,
          phoneVerified: true, // Trusted referral
        },
      });

      // Create consent record
      await prisma.consentRecord.create({
        data: {
          userId: user.id,
          phone: userPhone,
          consentType: 'partner_referral',
          consentStatus: 'confirmed',
          consentLanguage: getReferralConsentLanguage(lead.user_language, platform),
          userResponse: 'YES (via partner)',
          language: lead.user_language || 'en',
          channel: 'partner_api',
          sourcePlatform: platform,
        },
      });
    } else {
      // Update existing user with referral info if not already set
      if (!user.source) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            source: `${platform}_referral`,
            sourceLeadId: lead.source_conversation_id,
          },
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. CREATE LEAD RECORD
    // ═══════════════════════════════════════════════════════════════
    const healthcareCategory = mapToHealthcareCategory(
      lead.category,
      lead.subcategory
    );

    const careosLead = await prisma.lead.create({
      data: {
        userId: user.id,
        phoneHash: lead.user_phone_hash,

        // Source tracking
        sourcePlatform: platform,
        sourceLeadId: lead.source_conversation_id,

        // Category
        category: healthcareCategory,
        partnerName: platform,

        // Details
        needDescription: lead.original_message,
        leadDetails: lead.ai_extracted_details || {},
        urgency: lead.ai_extracted_details?.urgency || 'medium',

        // Location
        locationState: lead.user_location_state || null,
        country: lead.user_location_country || null,
        city: lead.user_location_city || null,

        // Consent
        consentGiven: true,
        consentTimestamp: new Date(lead.consent_timestamp),

        // Revenue
        referralFee: lead.lead_value_agreed,
        leadValue: lead.lead_value_agreed,

        // Status
        status: 'received',
      },
    });

    // ═══════════════════════════════════════════════════════════════
    // 6. SEND WELCOME MESSAGE
    // ═══════════════════════════════════════════════════════════════
    try {
      await sendWelcomeSMS(
        userPhone,
        user.language || lead.user_language || 'en',
        platform,
        lead.ai_extracted_details,
        user.id
      );
    } catch (error) {
      console.error('Failed to send welcome SMS:', error);
      // Continue even if SMS fails - we still have the lead
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. RECORD PARTNER PAYMENT (Pending)
    // ═══════════════════════════════════════════════════════════════
    await prisma.partnerPayment.create({
      data: {
        partner: platform,
        leadId: careosLead.id,
        amount: lead.lead_value_agreed,
        status: 'pending', // Pay on 30-day cycle
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    // ═══════════════════════════════════════════════════════════════
    // 8. TRACK ANALYTICS (Optional - implement your analytics)
    // ═══════════════════════════════════════════════════════════════
    // await trackEvent('lead.received_from_partner', {
    //   partner: platform,
    //   category: healthcareCategory,
    //   isNewUser,
    //   leadValue: lead.lead_value_agreed,
    // });

  // ═══════════════════════════════════════════════════════════════
  // 9. RETURN SUCCESS
  // ═══════════════════════════════════════════════════════════════
  return NextResponse.json({
    success: true,
    careos_lead_id: careosLead.id,
    careos_user_id: user.id,
    careos_will_contact: true,
    is_new_user: isNewUser,
  });
}

// Wrap handler with rate limiting, then error handling
const rateLimitedHandler = withRateLimit(RATE_LIMITS.partnerApi)(handler);
export const POST = withErrorHandling(rateLimitedHandler);

