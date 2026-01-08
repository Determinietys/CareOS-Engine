/**
 * Advanced language detection with script and keyword analysis
 */

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  method: string;
}

// Method 1: Script-based detection for non-Latin scripts
function detectFromScript(text: string): LanguageDetectionResult | null {
  const scripts = {
    chinese: /[\u4e00-\u9fff]/,
    japanese: /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/,
    korean: /[\uac00-\ud7af]/,
    arabic: /[\u0600-\u06ff]/,
    hebrew: /[\u0590-\u05ff]/,
    thai: /[\u0e00-\u0e7f]/,
    devanagari: /[\u0900-\u097f]/,
    cyrillic: /[\u0400-\u04ff]/,
  };
  
  const mapping: Record<string, string> = {
    chinese: 'zh',
    japanese: 'ja',
    korean: 'ko',
    arabic: 'ar',
    hebrew: 'he',
    thai: 'th',
    devanagari: 'hi',
    cyrillic: 'ru',
  };
  
  for (const [script, regex] of Object.entries(scripts)) {
    if (regex.test(text)) {
      return { 
        language: mapping[script], 
        confidence: 0.95,
        method: 'script'
      };
    }
  }
  return null;
}

// Method 2: Keyword-based detection for Latin scripts
function detectFromKeywords(text: string): LanguageDetectionResult | null {
  const keywords: Record<string, string[]> = {
    es: ['hola', 'gracias', 'buenos', 'sí', 'cómo', 'estás', 'adiós'],
    fr: ['bonjour', 'merci', 'salut', 'oui', 'comment', 'ça va', 'au revoir'],
    de: ['hallo', 'danke', 'guten', 'ja', 'wie', 'tschüss'],
    pt: ['olá', 'obrigado', 'oi', 'sim', 'como', 'tchau'],
    it: ['ciao', 'grazie', 'buon', 'sì', 'come', 'arrivederci'],
    nl: ['hallo', 'dank', 'goed', 'ja', 'hoe', 'doei'],
    pl: ['cześć', 'dziękuję', 'dobry', 'tak', 'jak', 'pa'],
    tr: ['merhaba', 'teşekkür', 'iyi', 'evet', 'nasıl', 'güle güle'],
    vi: ['xin chào', 'cảm ơn', 'tốt', 'có', 'như thế nào', 'tạm biệt'],
    id: ['halo', 'terima kasih', 'baik', 'ya', 'bagaimana', 'selamat tinggal'],
  };
  
  const lower = text.toLowerCase();
  let maxMatches = 0;
  let detectedLang = '';
  
  for (const [lang, words] of Object.entries(keywords)) {
    const matches = words.filter(w => lower.includes(w)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedLang = lang;
    }
  }
  
  if (maxMatches >= 2) {
    return {
      language: detectedLang,
      confidence: Math.min(0.85, 0.5 + (maxMatches * 0.1)),
      method: 'keyword'
    };
  }
  
  return null;
}

// Method 3: Character frequency analysis (simplified)
function detectFromCharacterFrequency(text: string): LanguageDetectionResult | null {
  // Common character patterns
  const patterns: Record<string, RegExp> = {
    es: /[ñáéíóúü¿¡]/,
    fr: /[àâäéèêëïîôùûüÿç]/,
    de: /[äöüß]/,
    pt: /[ãõáéíóúâêôç]/,
    it: /[àèéìíîòóùú]/,
  };
  
  for (const [lang, regex] of Object.entries(patterns)) {
    if (regex.test(text)) {
      return {
        language: lang,
        confidence: 0.75,
        method: 'character_frequency'
      };
    }
  }
  
  return null;
}

/**
 * Combined language detection
 */
export async function detectLanguage(
  text: string,
  context?: { phone?: string; userId?: string }
): Promise<LanguageDetectionResult> {
  if (!text || text.trim().length === 0) {
    return { language: 'en', confidence: 0.5, method: 'default' };
  }

  // 1. Try script detection (highest confidence)
  const scriptMatch = detectFromScript(text);
  if (scriptMatch && scriptMatch.confidence > 0.9) {
    return scriptMatch;
  }
  
  // 2. Try character frequency
  const charMatch = detectFromCharacterFrequency(text);
  if (charMatch) {
    return charMatch;
  }
  
  // 3. Try keyword detection
  const keywordMatch = detectFromKeywords(text);
  if (keywordMatch && keywordMatch.confidence > 0.8) {
    return keywordMatch;
  }
  
  // 4. Check user's stored language preference
  if (context?.userId) {
    // TODO: Fetch from database
    // const user = await prisma.user.findUnique({ where: { id: context.userId } });
    // if (user?.language) {
    //   return { language: user.language, confidence: 0.7, method: 'user_preference' };
    // }
  }
  
  // 5. Default to English
  return { language: 'en', confidence: 0.5, method: 'default' };
}

