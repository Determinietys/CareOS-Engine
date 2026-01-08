/**
 * Lead generation engine for partner referrals
 */

export const LEAD_PARTNERS: Record<
  string,
  { name: string; value: number; url?: string }
> = {
  caregiver_hiring: {
    name: 'Care.com',
    value: 15,
    url: 'https://care.com/?ref=careos',
  },
  telehealth_urgent: {
    name: 'Teladoc',
    value: 10,
    url: 'https://teladoc.com/?ref=careos',
  },
  medical_equipment: {
    name: 'Aeroflow',
    value: 25,
  },
  rx_savings: {
    name: 'GoodRx',
    value: 5,
    url: 'https://goodrx.com/?ref=careos',
  },
  home_modifications: {
    name: 'CAPS Network',
    value: 50,
  },
  meal_delivery: {
    name: "Mom's Meals",
    value: 10,
  },
  insurance: {
    name: 'Ethos',
    value: 35,
    url: 'https://ethos.com/?ref=careos',
  },
  legal_estate: {
    name: 'Trust & Will',
    value: 20,
  },
  memory_care: {
    name: 'A Place for Mom',
    value: 30,
  },
};

/**
 * Get lead partner information
 */
export function getLeadPartner(category: string): {
  name: string;
  value: number;
  url?: string;
} | null {
  return LEAD_PARTNERS[category] || null;
}

/**
 * Generate consent message for lead
 */
export function generateLeadConsentMessage(
  need: string,
  partnerName: string,
  language: string = 'en'
): string {
  const messages: Record<string, string> = {
    en: `For ${need}, I'd recommend ${partnerName} - they're trusted experts.

Want me to connect you? I'll share your needs so they can reach out.

Reply YES to connect or NO to skip.`,
    es: `Para ${need}, recomendaría ${partnerName} - son expertos de confianza.

¿Quieres que te conecte? Compartiré tus necesidades para que puedan contactarte.

Responde SÍ para conectar o NO para omitir.`,
    fr: `Pour ${need}, je recommanderais ${partnerName} - ce sont des experts de confiance.

Voulez-vous que je vous connecte? Je partagerai vos besoins pour qu'ils puissent vous contacter.

Répondez OUI pour vous connecter ou NON pour ignorer.`,
  };

  return messages[language] || messages.en;
}

