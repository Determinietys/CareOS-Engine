/**
 * Partner Integration Utilities
 * Helper functions for integrating with partner platforms like BusinessOS
 */

import { prisma } from '@/lib/prisma';
import { sendSMS } from '@/lib/twilio';
import { hashPhone } from './encryption';

/**
 * Map business category to healthcare category
 * Used when receiving leads from BusinessOS
 */
export function mapToHealthcareCategory(category: string, subcategory?: string): string {
  const mapping: Record<string, string> = {
    // Direct mappings
    healthcare: 'general_healthcare',
    health: 'general_healthcare',
    medical: 'general_healthcare',
    
    // Caregiver related
    caregiver: 'caregiver_hiring',
    caregiver_hiring: 'caregiver_hiring',
    staffing_hiring: 'caregiver_hiring',
    home_care: 'caregiver_hiring',
    senior_care: 'caregiver_hiring',
    elderly_care: 'senior_care',
    
    // Telehealth
    doctor: 'telehealth',
    telehealth: 'telehealth',
    telehealth_urgent: 'telehealth',
    consulting_urgent: 'telehealth',
    online_doctor: 'telehealth',
    
    // Medication
    medication: 'rx_management',
    rx_management: 'rx_management',
    prescription: 'rx_management',
    pharmacy: 'rx_management',
    
    // Mental health
    mental_health: 'mental_health',
    therapy: 'mental_health',
    counseling: 'mental_health',
    psychologist: 'mental_health',
    
    // Home health
    home_health: 'home_health',
    nursing: 'home_health',
    physical_therapy: 'home_health',
    
    // Medical equipment
    medical_equipment: 'medical_equipment',
    equipment_supply: 'medical_equipment',
    wheelchair: 'medical_equipment',
    mobility_aid: 'medical_equipment',
  };

  // Try subcategory first, then category
  const key = subcategory || category;
  const lowerKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  
  return mapping[lowerKey] || mapping[category.toLowerCase()] || 'general_healthcare';
}

/**
 * Get welcome message for partner-referred users
 */
export function getWelcomeFromReferral(
  language: string,
  source: string,
  details?: {
    service_type?: string;
    person_mentioned?: string;
    urgency?: string;
  }
): string {
  const sourceName = source === 'businessos' ? 'BusinessOS' : 'Our partner';

  const messages: Record<string, string> = {
    en: `👋 Hi! I'm CareOS, your family care assistant.

${sourceName} told me you need help${details?.service_type ? ` with ${details.service_type}` : ''}.

I specialize in:
• Finding caregivers & home health
• Health tracking & medication reminders
• Coordinating family care

How can I help you today?`,

    es: `👋 ¡Hola! Soy CareOS, tu asistente de cuidado familiar.

${sourceName} me dijo que necesitas ayuda${details?.service_type ? ` con ${details.service_type}` : ''}.

Me especializo en:
• Encontrar cuidadores y salud en el hogar
• Seguimiento de salud y medicamentos
• Coordinación de cuidado familiar

¿Cómo puedo ayudarte hoy?`,

    fr: `👋 Bonjour! Je suis CareOS, votre assistant de soins familiaux.

${sourceName} m'a dit que vous avez besoin d'aide${details?.service_type ? ` avec ${details.service_type}` : ''}.

Je me spécialise dans:
• Trouver des soignants et santé à domicile
• Suivi de santé et médicaments
• Coordination des soins familiaux

Comment puis-je vous aider?`,

    de: `👋 Hallo! Ich bin CareOS, Ihr Familienbetreuungsassistent.

${sourceName} hat mir gesagt, dass Sie Hilfe brauchen${details?.service_type ? ` bei ${details.service_type}` : ''}.

Ich spezialisiere mich auf:
• Finden von Betreuern und häuslicher Gesundheit
• Gesundheitsüberwachung und Medikamentenerinnerungen
• Koordination der Familienbetreuung

Wie kann ich Ihnen heute helfen?`,

    pt: `👋 Olá! Eu sou o CareOS, seu assistente de cuidados familiares.

${sourceName} me disse que você precisa de ajuda${details?.service_type ? ` com ${details.service_type}` : ''}.

Eu me especializo em:
• Encontrar cuidadores e saúde domiciliar
• Rastreamento de saúde e lembretes de medicamentos
• Coordenação de cuidados familiares

Como posso ajudá-lo hoje?`,
  };

  return messages[language] || messages.en;
}

/**
 * Get referral consent language for consent record
 */
export function getReferralConsentLanguage(language: string, source: string): string {
  const sourceName = source === 'businessos' ? 'BusinessOS' : 'partner';
  
  const consents: Record<string, string> = {
    en: `User consented via ${sourceName} partner referral to receive CareOS healthcare coordination messages.`,
    es: `Usuario consintió vía referencia de ${sourceName} para recibir mensajes de coordinación de salud de CareOS.`,
    fr: `L'utilisateur a consenti via la référence du partenaire ${sourceName} pour recevoir les messages de coordination des soins de santé de CareOS.`,
    de: `Der Benutzer hat über die Partnerreferenz ${sourceName} zugestimmt, Nachrichten zur Gesundheitskoordination von CareOS zu erhalten.`,
    pt: `O usuário consentiu via referência do parceiro ${sourceName} para receber mensagens de coordenação de saúde da CareOS.`,
  };

  return consents[language] || consents.en;
}

/**
 * Send welcome SMS to newly referred user
 */
export async function sendWelcomeSMS(
  phone: string,
  language: string,
  source: string,
  details?: {
    service_type?: string;
    person_mentioned?: string;
    urgency?: string;
  },
  userId?: string
): Promise<void> {
  const message = getWelcomeFromReferral(language, source, details);
  
  const messageSid = await sendSMS(phone, message);
  
  // Log the message if we have a userId
  if (userId && messageSid) {
    await prisma.message.create({
      data: {
        userId,
        direction: 'outbound',
        channel: 'sms',
        body: message,
        twilioSid: messageSid,
        status: 'queued',
      },
    });
  }
}

