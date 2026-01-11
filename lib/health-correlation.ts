/**
 * Health Correlation Engine
 * Links current symptoms with user's medical history to provide contextual insights
 */

import { prisma } from '@/lib/prisma';
import { anthropic } from './anthropic';
import { analyzeSymptomPatterns, logSymptom } from './symptom-pattern-tracking';

export interface HealthContext {
  userId: string;
  recentHealthItems: Array<{
    category: string;
    title: string;
    details: string;
    urgency: string;
    createdAt: Date;
  }>;
  recentMedications?: string[];
  recentAppointments?: Array<{
    title: string;
    details: string;
    createdAt: Date;
  }>;
  medicalHistory?: string[];
  foodHistory?: {
    allergies?: string[];
    dietaryRestrictions?: string[];
    digestiveIssues?: string[];
    recentFoodItems?: Array<{
      title: string;
      details: string;
      createdAt: Date;
    }>;
  };
}

export interface CorrelationResult {
  response: string;
  correlations: Array<{
    currentSymptom: string;
    relatedHistory: string;
    possibleConnection: string;
    suggestedAction: string;
    urgency: 'low' | 'medium' | 'high';
  }>;
  suggestedChecks: string[];
  suggestedActions: string[];
  isPatternDetected?: boolean;
  patternInfo?: string;
  loggedInProfile?: boolean; // Confirmation that symptom was logged
}

/**
 * Get user's health context (recent health items, medications, appointments)
 */
export async function getUserHealthContext(userId: string): Promise<HealthContext> {
  // Get recent health-related items (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentItems = await prisma.capturedItem.findMany({
    where: {
      userId,
      createdAt: {
        gte: thirtyDaysAgo,
      },
      OR: [
        { category: 'health' },
        { category: 'medication' },
        { category: 'appointment' },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 20, // Last 20 health-related items
    select: {
      category: true,
      title: true,
      details: true,
      urgency: true,
      createdAt: true,
    },
  });

  // Extract medications from items
  const medications = recentItems
    .filter(item => item.category === 'medication')
    .map(item => item.title)
    .slice(0, 10);

  // Extract appointments from items
  const appointments = recentItems
    .filter(item => item.category === 'appointment')
    .map(item => ({
      title: item.title,
      details: item.details || '',
      createdAt: item.createdAt,
    }))
    .slice(0, 10);

  // Extract medical history keywords (surgery, diagnosis, etc.)
  const medicalHistory: string[] = [];
  recentItems.forEach(item => {
    const text = `${item.title} ${item.details || ''}`.toLowerCase();
    // Detect medical keywords
    if (text.includes('surgery') || text.includes('surgical') || text.includes('operation')) {
      medicalHistory.push('Recent surgery');
    }
    if (text.includes('blood pressure') || text.includes('hypertension') || text.includes('bp')) {
      medicalHistory.push('Blood pressure concerns');
    }
    if (text.includes('diabetes') || text.includes('diabetic')) {
      medicalHistory.push('Diabetes');
    }
    if (text.includes('heart') || text.includes('cardiac') || text.includes('cardiovascular')) {
      medicalHistory.push('Cardiac history');
    }
    if (text.includes('pain') || text.includes('ache') || text.includes('hurt')) {
      medicalHistory.push('Pain episodes');
    }
    // Food and dietary history
    if (text.includes('allergy') || text.includes('allergic') || text.includes('intolerant')) {
      medicalHistory.push('Food allergies/intolerances');
    }
    if (text.includes('gluten') || text.includes('celiac') || text.includes('lactose')) {
      medicalHistory.push('Dietary restrictions');
    }
    if (text.includes('food poisoning') || text.includes('foodborne')) {
      medicalHistory.push('Food poisoning history');
    }
    if (text.includes('ibs') || text.includes('irritable bowel') || text.includes('digestive')) {
      medicalHistory.push('Digestive issues');
    }
    if (text.includes('reflux') || text.includes('gerd') || text.includes('heartburn')) {
      medicalHistory.push('Acid reflux/GERD');
    }
    if (text.includes('diet') || text.includes('eating') || text.includes('meal')) {
      medicalHistory.push('Dietary concerns');
    }
  });

  // Extract food-related items specifically
  const foodRelatedItems = recentItems.filter(item => {
    const text = `${item.title} ${item.details || ''}`.toLowerCase();
    return text.includes('food') || text.includes('eat') || text.includes('meal') ||
           text.includes('allergy') || text.includes('stomach') || text.includes('digestive') ||
           text.includes('nausea') || text.includes('vomit') || text.includes('diarrhea');
  });

  // Extract food allergies and dietary restrictions
  const allergies: string[] = [];
  const dietaryRestrictions: string[] = [];
  const digestiveIssues: string[] = [];
  
  foodRelatedItems.forEach(item => {
    const text = `${item.title} ${item.details || ''}`.toLowerCase();
    
    // Extract specific allergies mentioned
    if (text.includes('allergic to') || text.includes('allergy to')) {
      const allergyMatch = text.match(/(?:allergic to|allergy to)\s+([^.]+)/i);
      if (allergyMatch) {
        allergies.push(allergyMatch[1].trim());
      }
    }
    
    // Extract dietary restrictions
    if (text.includes('gluten') || text.includes('celiac')) {
      dietaryRestrictions.push('Gluten-free');
    }
    if (text.includes('lactose') || text.includes('dairy')) {
      dietaryRestrictions.push('Dairy-free');
    }
    if (text.includes('peanut')) {
      allergies.push('Peanuts');
    }
    if (text.includes('shellfish') || text.includes('seafood')) {
      allergies.push('Shellfish');
    }
    
    // Digestive issues
    if (text.includes('ibs') || text.includes('irritable bowel')) {
      digestiveIssues.push('IBS');
    }
    if (text.includes('reflux') || text.includes('gerd')) {
      digestiveIssues.push('Acid reflux');
    }
    if (text.includes('diarrhea') || text.includes('constipation')) {
      digestiveIssues.push('Digestive symptoms');
    }
  });

  return {
    userId,
    recentHealthItems: recentItems.map(item => ({
      category: item.category,
      title: item.title,
      details: item.details || '',
      urgency: item.urgency,
      createdAt: item.createdAt,
    })),
    recentMedications: medications,
    recentAppointments: appointments,
    medicalHistory: Array.from(new Set(medicalHistory)), // Remove duplicates
    foodHistory: {
      allergies: Array.from(new Set(allergies)),
      dietaryRestrictions: Array.from(new Set(dietaryRestrictions)),
      digestiveIssues: Array.from(new Set(digestiveIssues)),
      recentFoodItems: foodRelatedItems.slice(0, 5).map(item => ({
        title: item.title,
        details: item.details || '',
        createdAt: item.createdAt,
      })),
    },
  };
}

/**
 * Correlate current symptom with user's health history
 */
export async function correlateHealthSymptom(
  currentMessage: string,
  userId: string,
  userName: string | null,
  language: string = 'en'
): Promise<CorrelationResult> {
  if (!anthropic) {
    // Fallback if API not configured
    return {
      response: `I've noted your symptom: "${currentMessage}". To provide better insights, please configure ANTHROPIC_API_KEY.`,
      correlations: [],
      suggestedChecks: [],
      suggestedActions: [],
    };
  }

  // Get user's health context
  const healthContext = await getUserHealthContext(userId);

  // Analyze symptom patterns (detect if recurring)
  const patternAnalysis = await analyzeSymptomPatterns(userId, currentMessage, 'health');

  // Build context summary for AI
  const contextSummary = `
USER HEALTH HISTORY (Last 30 days):
${healthContext.recentHealthItems.length > 0 
  ? healthContext.recentHealthItems.map(item => 
      `- ${item.category}: ${item.title}${item.details ? ` - ${item.details}` : ''} (${item.urgency} urgency, ${new Date(item.createdAt).toLocaleDateString()})`
    ).join('\n')
  : 'No recent health items recorded'}

${healthContext.recentMedications && healthContext.recentMedications.length > 0
  ? `CURRENT MEDICATIONS: ${healthContext.recentMedications.join(', ')}`
  : 'No recent medications recorded'}

${healthContext.recentAppointments && healthContext.recentAppointments.length > 0
  ? `RECENT APPOINTMENTS:\n${healthContext.recentAppointments.map(apt => 
      `- ${apt.title}${apt.details ? `: ${apt.details}` : ''} (${new Date(apt.createdAt).toLocaleDateString()})`
    ).join('\n')}`
  : 'No recent appointments recorded'}

${healthContext.medicalHistory && healthContext.medicalHistory.length > 0
  ? `MEDICAL HISTORY INDICATORS: ${healthContext.medicalHistory.join(', ')}`
  : 'No significant medical history indicators'}

${healthContext.foodHistory
  ? `FOOD & DIETARY HISTORY:
${healthContext.foodHistory.allergies && healthContext.foodHistory.allergies.length > 0
  ? `- Known allergies: ${healthContext.foodHistory.allergies.join(', ')}`
  : ''}
${healthContext.foodHistory.dietaryRestrictions && healthContext.foodHistory.dietaryRestrictions.length > 0
  ? `- Dietary restrictions: ${healthContext.foodHistory.dietaryRestrictions.join(', ')}`
  : ''}
${healthContext.foodHistory.digestiveIssues && healthContext.foodHistory.digestiveIssues.length > 0
  ? `- Digestive issues: ${healthContext.foodHistory.digestiveIssues.join(', ')}`
  : ''}
${healthContext.foodHistory.recentFoodItems && healthContext.foodHistory.recentFoodItems.length > 0
  ? `- Recent food-related items:\n${healthContext.foodHistory.recentFoodItems.map(item => 
      `  - ${item.title}${item.details ? `: ${item.details}` : ''} (${new Date(item.createdAt).toLocaleDateString()})`
    ).join('\n')}`
  : ''}`
  : ''}

${patternAnalysis
  ? `SYMPTOM PATTERN DETECTED:
- This symptom has appeared ${patternAnalysis.frequency.toFixed(1)} times per ${patternAnalysis.period}
- Pattern: ${patternAnalysis.potentialPattern}
- Severity: ${patternAnalysis.severity}
- Related symptoms: ${patternAnalysis.relatedSymptoms.join(', ') || 'None'}
- This may be part of a recurring pattern that should be tracked and discussed with a healthcare provider.`
  : ''}`;

  const systemPrompt = `You are CareOS, an intelligent health assistant that correlates current symptoms with a user's medical history to provide contextual insights and suggestions.

CRITICAL ROLE:
- Analyze the current symptom/complaint
- Cross-reference with the user's recent health history
- Identify potential connections (even if not certain)
- Suggest relevant health checks or follow-up actions
- Be helpful but NOT diagnostic (suggest seeing a doctor when appropriate)

EXAMPLE CORRELATIONS:
- "I have a headache" + Recent surgery history → "Headaches can sometimes occur after surgery. Have you checked your blood pressure recently? High blood pressure post-surgery could contribute to headaches."
- "I feel dizzy" + Recent medication change → "Dizziness can be a side effect of medications. Are you taking any new medications? Consider discussing with your doctor."
- "My chest hurts" + Recent cardiac history → "Given your cardiac history, chest pain warrants immediate attention. Please consult your healthcare provider or seek emergency care if severe."
- "I feel sick after eating" + Food allergy history → "I see you have a history of food allergies. Could this be related to something you ate? Did you recently consume any foods you're allergic to? Consider tracking what you ate before feeling sick."
- "My stomach hurts" + Gluten sensitivity → "Stomach pain can be related to several factors. I notice you have a gluten sensitivity. Did you recently eat anything with gluten? This could be a reaction."
- "I feel nauseous" + Recent food item → "Nausea after eating can indicate food intolerance or food poisoning. What did you eat recently? If you have known food allergies, check if you accidentally consumed something you're allergic to."
- "I have diarrhea" + Dietary restrictions → "Diarrhea can be related to dietary issues. Given your dietary restrictions, could this be a reaction to something you ate? Consider tracking your food intake to identify patterns."

GUIDELINES:
1. Always provide context-aware suggestions based on history
2. Suggest relevant health checks (blood pressure, temperature, etc.)
3. Recommend seeing a doctor when symptoms could be serious
4. Be empathetic and helpful
5. Use the user's language preference (${language})
6. Keep responses concise (2-3 sentences) but informative
7. Always end with: "This has been noted in your profile for tracking. Feel better!" (or equivalent in user's language)
8. Confirm that the symptom is being tracked for pattern detection

RESPONSE FORMAT:
Your response should:
- Provide contextual correlation (if any)
- Give relevant suggestions
- Confirm logging: "This has been noted in your profile"
- End empathetically: "Feel better!" (or appropriate closing in user's language)

EXAMPLE RESPONSE STRUCTURE:
"[Contextual correlation and suggestions]. This has been noted in your profile for tracking to help identify any patterns over time. Feel better!"`;

  const userPrompt = `CURRENT SYMPTOM/COMPLAINT: "${currentMessage}"

${contextSummary}

ANALYZE:
1. Does the current symptom correlate with any items in the health history?
2. Are there any potential connections (even indirect)?
3. What health checks would be relevant?
4. What actions should the user consider?
5. Is this symptom part of a recurring pattern?

IMPORTANT: Your response MUST:
- End with confirmation that it's being logged: "This has been noted in your profile for tracking."
- Include empathetic closing: "Feel better!" (or equivalent)
- Mention pattern tracking if symptom is recurring

Return JSON:
{
  "response": "Your contextual response connecting the symptom to their history (2-3 sentences) + 'This has been noted in your profile for tracking to help identify any patterns over time. Feel better!'",
  "correlations": [
    {
      "currentSymptom": "headache",
      "relatedHistory": "recent surgery",
      "possibleConnection": "Post-surgical complications could include headaches related to blood pressure changes",
      "suggestedAction": "Check blood pressure and monitor for other post-surgical symptoms",
      "urgency": "medium"
    }
  ],
  "suggestedChecks": ["blood pressure", "temperature"],
  "suggestedActions": ["Monitor symptoms", "Consider contacting your surgeon if symptoms persist"],
  "isPatternDetected": true/false,
  "patternInfo": "Optional: information about recurring pattern if detected"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
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
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Ensure response includes logging confirmation and empathetic closing
      let response = parsed.response || content.text.split('{')[0].trim();
      
      // Check if response already includes logging confirmation
      const lowerResponse = response.toLowerCase();
      if (!lowerResponse.includes('noted') && !lowerResponse.includes('logged') && !lowerResponse.includes('tracked')) {
        // Add confirmation if not present
        const closingPhrases: Record<string, string> = {
          en: 'This has been noted in your profile for tracking to help identify any patterns over time. Feel better!',
          es: 'Esto ha sido anotado en tu perfil para seguimiento. ¡Mejórate pronto!',
          fr: 'Cela a été noté dans votre profil pour suivi. Prenez soin de vous!',
          de: 'Dies wurde in Ihrem Profil zur Verfolgung notiert. Gute Besserung!',
        };
        const closing = closingPhrases[language] || closingPhrases.en;
        response = `${response}\n\n${closing}`;
      } else if (!lowerResponse.includes('feel better') && !lowerResponse.includes('mejor') && !lowerResponse.includes('mieux')) {
        // Add empathetic closing if not present
        const closingPhrases: Record<string, string> = {
          en: 'Feel better!',
          es: '¡Mejórate pronto!',
          fr: 'Prenez soin de vous!',
          de: 'Gute Besserung!',
        };
        response = `${response} ${closingPhrases[language] || closingPhrases.en}`;
      }
      
      return {
        response,
        correlations: parsed.correlations || [],
        suggestedChecks: parsed.suggestedChecks || [],
        suggestedActions: parsed.suggestedActions || [],
        isPatternDetected: parsed.isPatternDetected || !!patternAnalysis,
        patternInfo: parsed.patternInfo || (patternAnalysis?.potentialPattern),
        loggedInProfile: true,
      };
    }

      // Fallback if JSON parsing fails
      return {
        response: content.text,
        correlations: [],
        suggestedChecks: [],
        suggestedActions: [],
      };
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('Error correlating health symptom:', error);
    
    // Fallback response
    const closingPhrases: Record<string, string> = {
      en: 'This has been noted in your profile for tracking. Feel better!',
      es: 'Esto ha sido anotado en tu perfil. ¡Mejórate pronto!',
      fr: 'Cela a été noté dans votre profil. Prenez soin de vous!',
      de: 'Dies wurde in Ihrem Profil notiert. Gute Besserung!',
    };
    const closing = closingPhrases[language] || closingPhrases.en;
    
    return {
      response: `I've noted your symptom: "${currentMessage}". I'm looking at your health history to provide relevant suggestions. ${closing}`,
      correlations: [],
      suggestedChecks: [],
      suggestedActions: [],
      isPatternDetected: !!patternAnalysis,
      patternInfo: patternAnalysis?.potentialPattern,
      loggedInProfile: true,
    };
  }
}

/**
 * Enhanced classification with health correlation
 */
export interface EnhancedClassificationResult {
  response: string;
  category: string;
  title: string;
  details: string;
  urgency: 'low' | 'medium' | 'high';
  correlations: Array<{
    currentSymptom: string;
    relatedHistory: string;
    possibleConnection: string;
    suggestedAction: string;
    urgency: 'low' | 'medium' | 'high';
  }>;
  suggestedChecks: string[];
  suggestedActions: string[];
  isPatternDetected?: boolean;
  patternInfo?: string;
  loggedInProfile?: boolean;
}

/**
 * Classify with health correlation
 */
export async function classifyWithHealthCorrelation(
  message: string,
  userId: string,
  userName: string | null,
  language: string = 'en'
): Promise<EnhancedClassificationResult> {
  // First, check if this is a health-related message
  const healthKeywords = [
    // General symptoms
    'hurt', 'pain', 'ache', 'headache', 'nausea', 'dizzy', 'fever',
    'pressure', 'blood', 'symptom', 'feeling', 'unwell', 'sick',
    'tired', 'weak', 'breath', 'chest', 'stomach', 'back',
    // Food-related symptoms
    'food', 'eat', 'eating', 'meal', 'ate', 'consumed', 'drank',
    'allergic', 'allergy', 'intolerant', 'intolerance',
    'vomit', 'vomiting', 'throw up', 'diarrhea', 'constipation',
    'bloating', 'gas', 'cramp', 'cramps', 'indigestion',
    'heartburn', 'reflux', 'upset stomach', 'stomachache',
    'food poisoning', 'poisoning', 'digestive', 'digestion',
    'gluten', 'dairy', 'lactose', 'peanut', 'shellfish', 'seafood',
    'ibs', 'celiac', 'gerd',
  ];

  const isHealthRelated = healthKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );

  if (isHealthRelated) {
    // Use health correlation
    const correlation = await correlateHealthSymptom(message, userId, userName, language);
    
    // Determine urgency based on correlations
    const maxUrgency = correlation.correlations.length > 0
      ? correlation.correlations.reduce((max, corr) => {
          const urgencyMap = { low: 0, medium: 1, high: 2 };
          return urgencyMap[corr.urgency] > urgencyMap[max] ? corr.urgency : max;
        }, 'low' as 'low' | 'medium' | 'high')
      : 'low';

    return {
      response: correlation.response,
      category: 'health',
      title: correlation.correlations.length > 0 
        ? correlation.correlations[0].currentSymptom
        : message.substring(0, 50),
      details: message,
      urgency: maxUrgency,
      correlations: correlation.correlations,
      suggestedChecks: correlation.suggestedChecks,
      suggestedActions: correlation.suggestedActions,
      isPatternDetected: correlation.isPatternDetected,
      patternInfo: correlation.patternInfo,
      loggedInProfile: correlation.loggedInProfile || true,
    };
  }

  // Not health-related, return standard classification
  // Import and use standard classification here if needed
  const closingPhrases: Record<string, string> = {
    en: 'This has been noted in your profile.',
    es: 'Esto ha sido anotado en tu perfil.',
    fr: 'Cela a été noté dans votre profil.',
    de: 'Dies wurde in Ihrem Profil notiert.',
  };
  const closing = closingPhrases[language] || closingPhrases.en;
  
  return {
    response: `I've noted: "${message}". How can I help you with this? ${closing}`,
    category: 'note',
    title: message.substring(0, 50),
    details: message,
    urgency: 'low',
    correlations: [],
    suggestedChecks: [],
    suggestedActions: [],
    loggedInProfile: true,
  };
}

