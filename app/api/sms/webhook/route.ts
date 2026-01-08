import { NextRequest, NextResponse } from 'next/server';
import { validateTwilioSignature } from '@/lib/twilio';
import { prisma } from '@/lib/prisma';
import {
  isOptOutKeyword,
  isOptInKeyword,
  isHelpKeyword,
  detectLanguage,
  getLocalizedMessage,
} from '@/lib/language';
import { classifySMS } from '@/lib/anthropic';
import { handleOnboarding, sendResponse, handleOptOut, hashPhone } from '@/lib/sms-flows';
import { getLeadPartner, generateLeadConsentMessage } from '@/lib/leads';
import { getExperimentContent, trackExperimentMetric } from '@/lib/ab-testing';
import { detectLanguage as detectLanguageAdvanced } from '@/lib/language-detection';
import { generateMultilingualResponse } from '@/lib/multilingual-ai';
import { extractLocation, extractBudgetFromText } from '@/lib/location-extraction';
import { matchVendorsToLead } from '@/lib/geographic-matching';

/**
 * Twilio webhook handler for incoming SMS/WhatsApp messages
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const body = Object.fromEntries(formData.entries()) as Record<string, string>;

    // Validate Twilio signature
    const signature = req.headers.get('x-twilio-signature');
    const url = `${process.env.BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sms/webhook`;

    if (signature && !validateTwilioSignature(url, body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const from = body.From || '';
    const message = (body.Body || '').trim();
    const messageSid = body.MessageSid || null;
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

    // Detect channel (SMS or WhatsApp)
    const isWhatsApp = from.startsWith('whatsapp:');
    const phone = isWhatsApp ? from.replace('whatsapp:', '') : from;
    const channel = isWhatsApp ? 'whatsapp' : 'sms';

    if (!phone || !message) {
      return NextResponse.json({ error: 'Missing phone or message' }, { status: 400 });
    }

    // Check suppression list
    const suppressed = await prisma.suppressionList.findUnique({
      where: { phone },
    });

    if (suppressed) {
      // Only respond to START/SUBSCRIBE
      if (isOptInKeyword(message)) {
        await prisma.suppressionList.delete({ where: { phone } });
        
        const user = await prisma.user.findUnique({ where: { phone } });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { status: 'active' },
          });
        }

        const response = getLocalizedMessage('optIn', user?.language || 'en');
        await sendResponse(phone, channel, response);
        return new NextResponse('', { status: 200 });
      }
      // Silently ignore messages from opted-out users
      return new NextResponse('', { status: 200 });
    }

    // Handle mandatory keywords (STOP, HELP)
    if (isOptOutKeyword(message)) {
      await handleOptOut(phone, channel, messageSid);
      const response = getLocalizedMessage('optOut', 'en');
      await sendResponse(phone, channel, response);
      return new NextResponse('', { status: 200 });
    }

    if (isHelpKeyword(message)) {
      const user = await prisma.user.findUnique({ where: { phone } });
      const response = getLocalizedMessage('help', user?.language || 'en');
      await sendResponse(phone, channel, response);
      return new NextResponse('', { status: 200 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      // New user - start onboarding
      const language = detectLanguage(message);
      
      // Check if this is an initial greeting
      const isGreeting = /^(hi|hello|hey|hola|bonjour|hallo|olá|你好|こんにちは|안녕)/i.test(message);
      
      if (!isGreeting) {
        // Not a greeting, send consent message first
        const consentMsg = getLocalizedMessage('consent', language);
        await sendResponse(phone, channel, consentMsg);
        
        // Create user in onboarding state
        user = await prisma.user.create({
          data: {
            phone,
            language,
            status: 'onboarding',
            onboardingStep: 'consent',
            preferredChannel: channel,
          },
        });
        
        // Store inbound message
        await prisma.message.create({
          data: {
            userId: user.id,
            direction: 'inbound',
            channel,
            body: message,
            twilioSid: messageSid || undefined,
          },
        });
        
        return new NextResponse('', { status: 200 });
      }

      // Create user and send consent
      user = await prisma.user.create({
        data: {
          phone,
          language,
          status: 'onboarding',
          onboardingStep: 'consent',
          preferredChannel: channel,
        },
      });

      // Get A/B test consent message
      const consentMsg = await getExperimentContent(
        'onboarding-consent-v2',
        user.id,
        language
      ) || getLocalizedMessage('consent', language);
      
      // Track message shown
      await trackExperimentMetric('onboarding-consent-v2', user.id, 'message_shown');
      
      await sendResponse(phone, channel, consentMsg);
      
      // Store inbound message
      await prisma.message.create({
        data: {
          userId: user.id,
          direction: 'inbound',
          channel,
          body: message,
          twilioSid: messageSid || undefined,
        },
      });
      
      return new NextResponse('', { status: 200 });
    }

    // Store inbound message
    await prisma.message.create({
      data: {
        userId: user.id,
        direction: 'inbound',
        channel,
        body: message,
        twilioSid: messageSid || undefined,
      },
    });

    // Route based on user status
    if (user.status === 'onboarding') {
      const response = await handleOnboarding(user, message, channel, messageSid, ipAddress);
      
      // Store outbound message
      const outboundSid = await sendResponse(phone, channel, response);
      if (outboundSid) {
        await prisma.message.create({
          data: {
            userId: user.id,
            direction: 'outbound',
            channel,
            body: response,
            twilioSid: outboundSid,
          },
        });
      }
      
      return new NextResponse('', { status: 200 });
    }

    // Active user - classify and respond with multilingual AI
    const aiResponse = await generateMultilingualResponse(message, {
      userName: user.name,
      language: user.language,
    });
    
    const classification = {
      ...aiResponse.classification,
      response: aiResponse.response,
    };

    // Store captured item
    await prisma.capturedItem.create({
      data: {
        userId: user.id,
        category: classification.category,
        title: classification.title,
        details: classification.details,
        person: classification.person || undefined,
        urgency: classification.urgency,
        originalText: message,
        language: user.language,
        source: channel,
        aiConfidence: null, // Could calculate confidence score
      },
    });

    // Handle lead opportunity
    if (classification.isLeadOpportunity && classification.leadCategory) {
      // Extract location and budget
      const locationData = await extractLocation(phone, message, {
        country: (classification as any).location?.country,
        city: (classification as any).location?.city,
        region: (classification as any).location?.region,
      });

      const budgetData = extractBudgetFromText(
        message,
        (classification as any).budget?.currency || locationData.currency
      );

      // If budget not in message, check classification
      if (!budgetData.budget && (classification as any).budget?.amount) {
        budgetData.budget = (classification as any).budget.amount;
        budgetData.currency = (classification as any).budget.currency || locationData.currency;
        budgetData.budgetUSD = budgetData.budget; // Simplified - should convert properly
      }

      const partner = getLeadPartner(classification.leadCategory);
      
      if (partner) {
        // Create lead record with location and budget
        const lead = await prisma.lead.create({
          data: {
            userId: user.id,
            phoneHash: hashPhone(phone),
            category: classification.leadCategory,
            partnerName: partner.name,
            needDescription: classification.details,
            leadDetails: {
              originalMessage: message,
              classification,
            },
            urgency: classification.urgency,
            status: 'captured',
            leadValue: partner.value,
            // Location data
            country: locationData.country,
            countryName: locationData.countryName,
            region: locationData.region,
            city: locationData.city,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            timezone: locationData.timezone,
            currency: budgetData.currency || locationData.currency,
            budget: budgetData.budget ? Number(budgetData.budget) : undefined,
            budgetUSD: budgetData.budgetUSD ? Number(budgetData.budgetUSD) : undefined,
          },
        });

        // Try to match with regional vendors
        if (locationData.country) {
          const vendorMatches = await matchVendorsToLead(lead.id, {
            country: locationData.country,
            city: locationData.city,
            category: classification.leadCategory,
            budgetUSD: budgetData.budgetUSD ? Number(budgetData.budgetUSD) : undefined,
          });

          // Store top matches in lead details
          if (vendorMatches.length > 0) {
            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                leadDetails: {
                  ...(lead.leadDetails as any),
                  matchedVendors: vendorMatches.slice(0, 5).map((m) => ({
                    vendorId: m.vendor.id,
                    score: m.score,
                    reasons: m.reasons,
                  })),
                },
              },
            });
          }
        }

        // Ask for consent
        if (classification.askConsent) {
          const consentMsg = generateLeadConsentMessage(
            classification.details,
            partner.name,
            user.language
          );
          
          // Store outbound message
          const outboundSid = await sendResponse(phone, channel, consentMsg);
          if (outboundSid) {
            await prisma.message.create({
              data: {
                userId: user.id,
                direction: 'outbound',
                channel,
                body: consentMsg,
                twilioSid: outboundSid,
              },
            });
          }
          
          return new NextResponse('', { status: 200 });
        }
      }
    }

    // Send AI response
    await sendResponse(phone, channel, classification.response);
    
    // Store outbound message
    const outboundSid = await sendResponse(phone, channel, classification.response);
    if (outboundSid) {
      await prisma.message.create({
        data: {
          userId: user.id,
          direction: 'outbound',
          channel,
          body: classification.response,
          twilioSid: outboundSid,
        },
      });
    }

    return new NextResponse('', { status: 200 });
  } catch (error) {
    console.error('Error processing SMS webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET for webhook verification (Twilio sometimes sends GET)
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

