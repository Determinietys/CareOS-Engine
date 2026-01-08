/**
 * Language detection and localization for SMS platform
 */

export const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  en: ['hi', 'hello', 'hey', 'yes', 'help', 'start', 'stop'],
  es: ['hola', 'si', 'sí', 'buenos', 'gracias', 'ayuda', 'inicio', 'parar'],
  fr: ['bonjour', 'salut', 'oui', 'merci', 'aide', 'commencer', 'arrêter'],
  de: ['hallo', 'guten', 'ja', 'danke', 'hilfe', 'start', 'stopp'],
  pt: ['olá', 'oi', 'sim', 'obrigado', 'ajuda', 'iniciar', 'parar'],
  zh: ['你好', '是', '谢谢', '帮助', '开始', '停止'],
  ja: ['こんにちは', 'はい', 'ありがとう', 'ヘルプ', '開始', '停止'],
  ko: ['안녕', '네', '감사', '도움', '시작', '중지'],
};

export const MANDATORY_KEYWORDS = {
  optOut: ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'STOPALL'],
  optIn: ['START', 'YES', 'UNSTOP', 'SUBSCRIBE'],
  help: ['HELP', 'INFO'],
};

/**
 * Detect language from message text
 */
export function detectLanguage(text: string): string {
  const normalized = text.toLowerCase().trim();

  for (const [lang, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return lang;
      }
    }
  }

  return 'en'; // Default to English
}

/**
 * Check if message is an opt-out keyword
 */
export function isOptOutKeyword(text: string): boolean {
  const normalized = text.toUpperCase().trim();
  return MANDATORY_KEYWORDS.optOut.some(keyword => normalized === keyword || normalized.startsWith(keyword));
}

/**
 * Check if message is an opt-in keyword
 */
export function isOptInKeyword(text: string): boolean {
  const normalized = text.toUpperCase().trim();
  return MANDATORY_KEYWORDS.optIn.some(keyword => normalized === keyword || normalized.startsWith(keyword));
}

/**
 * Check if message is a help keyword
 */
export function isHelpKeyword(text: string): boolean {
  const normalized = text.toUpperCase().trim();
  return MANDATORY_KEYWORDS.help.some(keyword => normalized === keyword || normalized.startsWith(keyword));
}

/**
 * Localized messages
 */
export const LOCALIZED_MESSAGES: Record<string, Record<string, string>> = {
  en: {
    consent: `👋 Welcome to CareOS!

By continuing, you agree to receive SMS messages for care coordination.

Msg & data rates may apply.
Reply STOP anytime to opt out.

Reply YES to continue.`,
    welcome: `Welcome to CareOS! 🎉

You can now text me:
• Health updates
• Medication reminders
• Appointments
• Tasks
• Questions

Try: "Mom took her blood pressure: 120/80"`,
    help: `CareOS Help

Text me:
• Health updates
• Medication reminders
• Appointments
• Tasks
• Questions

Reply STOP to unsubscribe.
Support: support@careos.app`,
    optOut: `You have been unsubscribed. Reply START to resubscribe.`,
    optIn: `Welcome back! You're subscribed again.`,
    name_prompt: `What's your first name?`,
    name_invalid: `Please provide a valid name (at least 2 characters).`,
    email_prompt: `Thanks! What's your email address? (for account recovery)`,
    email_invalid: `Please provide a valid email address.`,
    email_taken: `This email is already registered. Please use a different one.`,
    password_prompt: `Create a password (at least 6 characters):`,
    password_invalid: `Password must be at least 6 characters. Please try again:`,
  },
  es: {
    consent: `👋 ¡Bienvenido a CareOS!

Al continuar, aceptas recibir mensajes SMS para coordinación de cuidados.

Pueden aplicarse tarifas de mensajes y datos.
Responde STOP en cualquier momento para cancelar.

Responde SÍ para continuar.`,
    welcome: `¡Bienvenido a CareOS! 🎉

Ahora puedes enviarme:
• Actualizaciones de salud
• Recordatorios de medicamentos
• Citas
• Tareas
• Preguntas

Prueba: "Mamá tomó su presión arterial: 120/80"`,
    help: `Ayuda de CareOS

Envíame:
• Actualizaciones de salud
• Recordatorios de medicamentos
• Citas
• Tareas
• Preguntas

Responde STOP para cancelar.
Soporte: support@careos.app`,
    optOut: `Has sido dado de baja. Responde START para volver a suscribirte.`,
    optIn: `¡Bienvenido de nuevo! Estás suscrito nuevamente.`,
  },
  fr: {
    consent: `👋 Bienvenue sur CareOS!

En continuant, vous acceptez de recevoir des SMS pour la coordination des soins.

Des frais de messagerie et de données peuvent s'appliquer.
Répondez STOP à tout moment pour vous désabonner.

Répondez OUI pour continuer.`,
    welcome: `Bienvenue sur CareOS! 🎉

Vous pouvez maintenant m'envoyer:
• Mises à jour de santé
• Rappels de médicaments
• Rendez-vous
• Tâches
• Questions

Essayez: "Maman a pris sa tension: 120/80"`,
    help: `Aide CareOS

Envoyez-moi:
• Mises à jour de santé
• Rappels de médicaments
• Rendez-vous
• Tâches
• Questions

Répondez STOP pour vous désabonner.
Support: support@careos.app`,
    optOut: `Vous avez été désabonné. Répondez START pour vous réabonner.`,
    optIn: `Bienvenue! Vous êtes réabonné.`,
  },
};

/**
 * Get localized message
 */
export function getLocalizedMessage(key: string, language: string = 'en'): string {
  const messages = LOCALIZED_MESSAGES[language] || LOCALIZED_MESSAGES.en;
  return messages[key] || messages.help || 'Help message not available.';
}

