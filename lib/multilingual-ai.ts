import { anthropic } from './anthropic';

/**
 * Supported languages with native names and direction
 */
export const SUPPORTED_LANGUAGES: Record<string, { name: string; native: string; direction: 'ltr' | 'rtl' }> = {
  en: { name: 'English', native: 'English', direction: 'ltr' },
  es: { name: 'Spanish', native: 'Español', direction: 'ltr' },
  fr: { name: 'French', native: 'Français', direction: 'ltr' },
  de: { name: 'German', native: 'Deutsch', direction: 'ltr' },
  pt: { name: 'Portuguese', native: 'Português', direction: 'ltr' },
  it: { name: 'Italian', native: 'Italiano', direction: 'ltr' },
  zh: { name: 'Chinese', native: '中文', direction: 'ltr' },
  ja: { name: 'Japanese', native: '日本語', direction: 'ltr' },
  ko: { name: 'Korean', native: '한국어', direction: 'ltr' },
  ar: { name: 'Arabic', native: 'العربية', direction: 'rtl' },
  hi: { name: 'Hindi', native: 'हिन्दी', direction: 'ltr' },
  ru: { name: 'Russian', native: 'Русский', direction: 'ltr' },
  nl: { name: 'Dutch', native: 'Nederlands', direction: 'ltr' },
  pl: { name: 'Polish', native: 'Polski', direction: 'ltr' },
  tr: { name: 'Turkish', native: 'Türkçe', direction: 'ltr' },
  vi: { name: 'Vietnamese', native: 'Tiếng Việt', direction: 'ltr' },
  th: { name: 'Thai', native: 'ไทย', direction: 'ltr' },
  id: { name: 'Indonesian', native: 'Bahasa Indonesia', direction: 'ltr' },
  he: { name: 'Hebrew', native: 'עברית', direction: 'rtl' },
  cs: { name: 'Czech', native: 'Čeština', direction: 'ltr' },
  sv: { name: 'Swedish', native: 'Svenska', direction: 'ltr' },
  da: { name: 'Danish', native: 'Dansk', direction: 'ltr' },
  fi: { name: 'Finnish', native: 'Suomi', direction: 'ltr' },
  no: { name: 'Norwegian', native: 'Norsk', direction: 'ltr' },
  el: { name: 'Greek', native: 'Ελληνικά', direction: 'ltr' },
  hu: { name: 'Hungarian', native: 'Magyar', direction: 'ltr' },
  ro: { name: 'Romanian', native: 'Română', direction: 'ltr' },
};

export interface MultilingualResponse {
  response: string;
  classification: {
    category: string;
    title: string;
    details: string;
    urgency: string;
    isLeadOpportunity: boolean;
  };
}

/**
 * Generate multi-language AI response
 */
export async function generateMultilingualResponse(
  userMessage: string,
  context: {
    userName: string | null;
    language: string;
    conversationHistory?: Array<{ role: string; content: string }>;
  }
): Promise<MultilingualResponse> {
  if (!anthropic) {
    // Fallback if API not configured
    return {
      response: `Hi${context.userName ? ` ${context.userName}` : ''}! I received your message. This is a demo response.`,
      classification: {
        category: 'note',
        title: 'Demo Message',
        details: userMessage,
        urgency: 'low',
        isLeadOpportunity: false,
      },
    };
  }

  const langConfig = SUPPORTED_LANGUAGES[context.language] || SUPPORTED_LANGUAGES.en;
  
  const systemPrompt = `You are CareOS, a caring family health assistant.

CRITICAL: You MUST respond entirely in ${langConfig.name} (${langConfig.native}).
- Use natural, conversational ${langConfig.name}
- Match the user's formality level
- Use culturally appropriate expressions
- Keep responses brief (2-3 sentences for SMS)
- Be warm and helpful

User's name: ${context.userName || 'Friend'}
Language: ${langConfig.native}

PRODUCT RULES (apply in any language):
1. Recommend CareOS features first
2. Never recommend competitors (CaringBridge, Medisafe, Lotsa, MyChart)
3. Identify lead opportunities when CareOS can't help
4. Be concise for SMS delivery`;

  try {
    const userPrompt = `User message: "${userMessage}"

Respond in ${langConfig.name}, then provide JSON:
{
  "response": "Your ${langConfig.name} response (2-3 sentences)",
  "category": "health|task|appointment|medication|question|note|lead",
  "title": "short title",
  "details": "extracted details",
  "urgency": "low|medium|high",
  "isLeadOpportunity": false
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        ...(context.conversationHistory || []),
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          response: parsed.response || content.text.split('{')[0].trim(),
          classification: {
            category: parsed.category || 'note',
            title: parsed.title || 'Message',
            details: parsed.details || userMessage,
            urgency: parsed.urgency || 'low',
            isLeadOpportunity: parsed.isLeadOpportunity || false,
          },
        };
      }
      
      // If no JSON, return the text response
      return {
        response: content.text,
        classification: {
          category: 'note',
          title: 'Message',
          details: userMessage,
          urgency: 'low',
          isLeadOpportunity: false,
        },
      };
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('Error generating multilingual response:', error);
    return {
      response: `Hi${context.userName ? ` ${context.userName}` : ''}! I received your message. Let me help you with that.`,
      classification: {
        category: 'note',
        title: 'Message',
        details: userMessage,
        urgency: 'low',
        isLeadOpportunity: false,
      },
    };
  }
}

