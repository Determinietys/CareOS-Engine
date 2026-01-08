/**
 * Deep link generation for SMS and WhatsApp
 */

export type Platform = 'ios' | 'android' | 'web';

/**
 * Detect user's platform
 */
export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'web';
  
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'web';
}

/**
 * Generate SMS deep link
 */
export function generateSMSDeepLink(phone: string, body: string = ''): string {
  const platform = detectPlatform();
  const encodedBody = encodeURIComponent(body);
  const cleanPhone = phone.replace(/\D/g, '');
  
  switch (platform) {
    case 'ios':
      // iOS uses & separator (iOS 8+)
      return `sms:${cleanPhone}&body=${encodedBody}`;
    case 'android':
      // Android uses ? separator
      return `sms:${cleanPhone}?body=${encodedBody}`;
    default:
      // Web: use ? (works on most)
      return `sms:${cleanPhone}?body=${encodedBody}`;
  }
}

/**
 * Generate WhatsApp deep link
 */
export function generateWhatsAppDeepLink(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${cleanPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}

/**
 * Generate Telegram deep link
 */
export function generateTelegramDeepLink(username: string, message?: string): string {
  const encodedMessage = message ? encodeURIComponent(message) : '';
  return `https://t.me/${username.replace('@', '')}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}

