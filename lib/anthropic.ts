import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('Anthropic API key not configured. AI features will be disabled.');
}

export const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export interface ClassificationResult {
  response: string;
  category: 'health' | 'task' | 'appointment' | 'medication' | 'question' | 'note' | 'lead';
  title: string;
  details: string;
  person: string | null;
  urgency: 'low' | 'medium' | 'high';
  canCareOSHelp: boolean;
  careosFeature: string | null;
  upsellOpportunity: 'pro' | 'expert_connect' | null;
  isLeadOpportunity: boolean;
  leadCategory: string | null;
  leadPartner: string | null;
  askConsent: boolean;
}

/**
 * Classify SMS message using Claude API
 */
export async function classifySMS(
  text: string,
  userName: string | null,
  language: string
): Promise<ClassificationResult> {
  if (!anthropic) {
    // Return mock response if API not configured
    return {
      response: `Hi${userName ? ` ${userName}` : ''}! I received your message: "${text}". This is a demo response. Please configure ANTHROPIC_API_KEY to enable AI classification.`,
      category: 'note',
      title: 'Demo Message',
      details: text,
      person: null,
      urgency: 'low',
      canCareOSHelp: false,
      careosFeature: null,
      upsellOpportunity: null,
      isLeadOpportunity: false,
      leadCategory: null,
      leadPartner: null,
      askConsent: false,
    };
  }

  try {
    const systemPrompt = `You are CareOS, a family care assistant.

PRODUCT RECOMMENDATION HIERARCHY:
1. FIRST: Recommend CareOS features if relevant
2. SECOND: Recommend CareOS Premium if relevant
3. THIRD: If CareOS cannot help → identify as lead opportunity

CAREOS FEATURES (recommend first):
- Health tracking via text
- Medication reminders
- Family care circle (invite caregivers)
- Appointment tracking
- Task management
- Document storage (photos)
- WhatsApp support

CAREOS PREMIUM ($9.99/mo):
- Expert Connect (nurse consultations)
- Care Reports (weekly summaries)
- Calendar sync
- Unlimited family members

LEAD CATEGORIES (when CareOS can't help):
- caregiver_hiring → Partner: Care.com
- telehealth_urgent → Partner: Teladoc
- medical_equipment → Partner: Aeroflow
- rx_savings → Partner: GoodRx
- home_modifications → Partner: CAPS Network
- meal_delivery → Partner: Mom's Meals
- insurance → Partner: Ethos
- legal_estate → Partner: Trust & Will
- memory_care → Partner: A Place for Mom

NEVER recommend competitors: CaringBridge, Medisafe, Lotsa, MyChart.`;

    const userPrompt = `User "${userName || 'Unknown'}" texted. Language: ${language}.

Return JSON:
{
  "response": "SMS reply (2-3 sentences)",
  "category": "health|task|appointment|medication|question|note|lead",
  "title": "short title",
  "details": "extracted details",
  "person": "person mentioned or null",
  "urgency": "low|medium|high",
  "canCareOSHelp": true/false,
  "careosFeature": "feature name or null",
  "upsellOpportunity": "pro|expert_connect|null",
  "isLeadOpportunity": true/false,
  "leadCategory": "category or null",
  "leadPartner": "partner name or null",
  "askConsent": true/false,
  "location": {
    "country": "ISO country code (e.g., NG, US, GB) or null",
    "city": "city name or null",
    "region": "state/province/region or null"
  },
  "budget": {
    "amount": number or null,
    "currency": "ISO currency code (e.g., NGN, USD, GBP) or null"
  }
}

Message: "${text}"`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as ClassificationResult;
      }
    }

    // Fallback if JSON parsing fails
    return {
      response: content.type === 'text' ? content.text : 'I received your message. How can I help?',
      category: 'note',
      title: 'Message',
      details: text,
      person: null,
      urgency: 'low',
      canCareOSHelp: false,
      careosFeature: null,
      upsellOpportunity: null,
      isLeadOpportunity: false,
      leadCategory: null,
      leadPartner: null,
      askConsent: false,
    };
  } catch (error) {
    console.error('Error classifying SMS:', error);
    return {
      response: `Hi${userName ? ` ${userName}` : ''}! I received your message. Let me help you with that.`,
      category: 'note',
      title: 'Message',
      details: text,
      person: null,
      urgency: 'low',
      canCareOSHelp: false,
      careosFeature: null,
      upsellOpportunity: null,
      isLeadOpportunity: false,
      leadCategory: null,
      leadPartner: null,
      askConsent: false,
    };
  }
}

