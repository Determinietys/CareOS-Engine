/**
 * RCS (Rich Communication Services) messaging support
 * Falls back to SMS automatically if RCS is not available
 */

import { sendSMS } from './twilio';

export interface RCSMessage {
  phone: string;
  text?: string;
  mediaUrl?: string;
  suggestions?: Array<{
    type: 'reply' | 'action';
    text: string;
    postbackData?: string;
    url?: string;
  }>;
}

export interface RCSCapability {
  rcsEnabled: boolean;
  features: string[];
}

/**
 * Check RCS capability for a phone number
 * Note: This requires Google RCS Business Messaging API setup
 */
export async function checkRCSCapability(phone: string): Promise<RCSCapability> {
  // TODO: Implement Google RCS Business Messaging API check
  // This requires:
  // 1. Google Cloud project with RCS Business Messaging enabled
  // 2. Service account credentials
  // 3. Agent ID configuration
  
  // For now, return false (will fallback to SMS)
  // In production, implement:
  /*
  try {
    const rbm = require('@google-cloud/rcs-business-messaging');
    const client = new rbm.RcsBusinessMessagingClient();
    
    const response = await client.getCapabilities({
      name: `phones/${phone.replace('+', '')}`,
    });
    
    return {
      rcsEnabled: response.data.features?.includes('RICHCARD_STANDALONE') || false,
      features: response.data.features || [],
    };
  } catch (error) {
    console.error('Error checking RCS capability:', error);
    return { rcsEnabled: false, features: [] };
  }
  */
  
  return { rcsEnabled: false, features: [] };
}

/**
 * Send RCS message with automatic fallback to SMS
 */
export async function sendRCSMessage(message: RCSMessage): Promise<{
  success: boolean;
  method: 'rcs' | 'sms';
  messageId?: string;
}> {
  const capability = await checkRCSCapability(message.phone);

  if (capability.rcsEnabled) {
    try {
      // TODO: Implement Google RCS Business Messaging API send
      // This requires:
      // 1. Google Cloud project setup
      // 2. RCS Business Messaging API enabled
      // 3. Agent ID and credentials
      
      /*
      const rbm = require('@google-cloud/rcs-business-messaging');
      const client = new rbm.RcsBusinessMessagingClient();
      
      const payload: any = {
        parent: `phones/${message.phone.replace('+', '')}`,
        requestBody: {
          contentMessage: {
            text: message.text,
          },
        },
      };
      
      // Add suggestions (quick replies)
      if (message.suggestions?.length) {
        payload.requestBody.contentMessage.suggestions = message.suggestions.map((s) => {
          if (s.type === 'reply') {
            return { 
              reply: { 
                text: s.text, 
                postbackData: s.postbackData || s.text 
              } 
            };
          } else {
            return {
              action: {
                text: s.text,
                openUrlAction: s.url ? { url: s.url } : undefined,
              },
            };
          }
        });
      }
      
      const response = await client.phones.agentMessages.create(payload);
      return { success: true, method: 'rcs', messageId: response.data.name };
      */
      
      // Placeholder: RCS not yet implemented
      console.log('RCS capability detected but not implemented yet');
    } catch (error) {
      console.log('RCS send failed, falling back to SMS:', error);
    }
  }

  // Fallback to SMS
  const smsSid = await sendSMS(message.phone, message.text || '');
  return {
    success: !!smsSid,
    method: 'sms',
    messageId: smsSid || undefined,
  };
}

/**
 * Send RCS onboarding message with buttons
 */
export async function sendRCSOnboardingMessage(
  phone: string,
  language: string = 'en'
): Promise<{ success: boolean; method: 'rcs' | 'sms' }> {
  const messages: Record<string, string> = {
    en: '👋 Welcome to CareOS!\n\nBy continuing, you agree to receive messages for care coordination.\n\nMsg rates may apply.',
    es: '👋 ¡Bienvenido a CareOS!\n\nAl continuar, aceptas recibir mensajes para coordinación de cuidados.\n\nPueden aplicarse tarifas de mensajes.',
    fr: '👋 Bienvenue sur CareOS!\n\nEn continuant, vous acceptez de recevoir des messages pour la coordination des soins.\n\nDes frais de messagerie peuvent s\'appliquer.',
  };

  const text = messages[language] || messages.en;

  return await sendRCSMessage({
    phone,
    text,
    suggestions: [
      { type: 'reply', text: language === 'es' ? 'SÍ, acepto' : language === 'fr' ? 'OUI, j\'accepte' : 'YES, I agree', postbackData: 'consent_yes' },
      { type: 'reply', text: language === 'es' ? 'No gracias' : language === 'fr' ? 'Non merci' : 'No thanks', postbackData: 'consent_no' },
      { type: 'action', text: 'Privacy Policy', url: 'https://careos.app/privacy' },
    ],
  });
}

