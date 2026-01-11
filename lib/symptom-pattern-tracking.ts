/**
 * Symptom Pattern Tracking
 * Detects if symptoms are part of a larger pattern or recurring issue
 */

import { prisma } from '@/lib/prisma';

export interface SymptomPattern {
  symptomType: string;
  frequency: number; // How many times in the period
  period: string; // 'daily', 'weekly', 'monthly'
  severity: 'low' | 'medium' | 'high';
  relatedSymptoms: string[];
  potentialPattern: string; // Description of potential pattern
  recommendedAction: string;
}

export interface SymptomLog {
  userId: string;
  symptom: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  correlatedHistory?: string[];
  timestamp: Date;
}

/**
 * Log a symptom for pattern tracking
 */
export async function logSymptom(log: SymptomLog): Promise<string> {
  // Create captured item (already done in main flow, but ensure it's marked as symptom)
  // This function tracks it specifically for pattern analysis
  
  // The symptom is already saved as capturedItem, we just need to analyze patterns
  const itemId = `symptom_${Date.now()}`;
  
  // Pattern analysis happens asynchronously in analyzeSymptomPatterns
  return itemId;
}

/**
 * Analyze symptom patterns for a user
 */
export async function analyzeSymptomPatterns(
  userId: string,
  currentSymptom: string,
  symptomCategory: string = 'health'
): Promise<SymptomPattern | null> {
  // Look at last 90 days for pattern detection
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Get all health-related items in the period
  const recentSymptoms = await prisma.capturedItem.findMany({
    where: {
      userId,
      category: symptomCategory,
      createdAt: {
        gte: ninetyDaysAgo,
      },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      title: true,
      details: true,
      urgency: true,
      createdAt: true,
      category: true,
    },
  });

  if (recentSymptoms.length < 2) {
    // Need at least 2 occurrences to detect a pattern
    return null;
  }

  // Normalize symptom text for comparison
  const normalizeSymptom = (text: string): string => {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const normalizedCurrent = normalizeSymptom(currentSymptom);
  
  // Find similar symptoms (headache variations, stomach pain variations, etc.)
  const similarSymptoms = recentSymptoms.filter(item => {
    const normalized = normalizeSymptom(`${item.title} ${item.details || ''}`);
    // Check for keyword overlap (simple matching - could be enhanced)
    const currentKeywords = normalizedCurrent.split(' ').filter(w => w.length > 3);
    const itemKeywords = normalized.split(' ').filter(w => w.length > 3);
    const overlap = currentKeywords.filter(kw => itemKeywords.includes(kw)).length;
    return overlap >= 1 || normalized.includes(normalizedCurrent) || normalizedCurrent.includes(normalized);
  });

  if (similarSymptoms.length < 2) {
    return null;
  }

  // Calculate frequency
  const dates = similarSymptoms.map(s => s.createdAt);
  const firstDate = dates[dates.length - 1];
  const lastDate = dates[0];
  const daysDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let period: 'daily' | 'weekly' | 'monthly';
  let frequency: number;
  
  if (daysDiff <= 7) {
    period = 'daily';
    frequency = similarSymptoms.length / Math.max(daysDiff, 1);
  } else if (daysDiff <= 30) {
    period = 'weekly';
    frequency = similarSymptoms.length / Math.max(daysDiff / 7, 1);
  } else {
    period = 'monthly';
    frequency = similarSymptoms.length / Math.max(daysDiff / 30, 1);
  }

  // Calculate average severity
  const urgencyMap = { low: 0, medium: 1, high: 2 };
  const avgUrgency = Math.round(
    similarSymptoms.reduce((sum, s) => sum + urgencyMap[s.urgency as 'low' | 'medium' | 'high'], 0) / similarSymptoms.length
  );
  const severity: 'low' | 'medium' | 'high' = avgUrgency === 0 ? 'low' : avgUrgency === 1 ? 'medium' : 'high';

  // Find related symptoms that occur alongside
  const relatedSymptoms = recentSymptoms
    .filter(item => {
      const itemNorm = normalizeSymptom(`${item.title} ${item.details || ''}`);
      return !similarSymptoms.find(s => 
        normalizeSymptom(`${s.title} ${s.details || ''}`) === itemNorm
      ) && item.createdAt >= firstDate;
    })
    .map(item => item.title)
    .slice(0, 3);

  // Determine potential pattern
  let potentialPattern = '';
  let recommendedAction = '';

  if (frequency > 3 && period === 'weekly') {
    potentialPattern = `This symptom appears to be recurring frequently (${similarSymptoms.length} times in ${daysDiff} days). It may be part of an ongoing issue.`;
    recommendedAction = 'Consider tracking when symptoms occur, what triggers them, and discuss patterns with your healthcare provider.';
  } else if (frequency > 1 && period === 'daily') {
    potentialPattern = `This symptom has occurred multiple times recently. There may be a recurring pattern or trigger.`;
    recommendedAction = 'Keep a detailed log of when symptoms occur and what you were doing/eating before. This can help identify triggers.';
  } else if (similarSymptoms.length >= 3) {
    potentialPattern = `You've reported this symptom ${similarSymptoms.length} times recently. It may be part of a larger pattern.`;
    recommendedAction = 'Pattern tracking can help identify triggers. Consider keeping a symptom diary to share with your healthcare provider.';
  }

  return {
    symptomType: currentSymptom,
    frequency,
    period,
    severity,
    relatedSymptoms: Array.from(new Set(relatedSymptoms)),
    potentialPattern,
    recommendedAction,
  };
}

/**
 * Get symptom tracking summary
 */
export async function getSymptomTrackingSummary(userId: string): Promise<{
  totalSymptoms: number;
  recurringSymptoms: string[];
  patterns: SymptomPattern[];
}> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const symptoms = await prisma.capturedItem.findMany({
    where: {
      userId,
      category: 'health',
      createdAt: {
        gte: ninetyDaysAgo,
      },
    },
    select: {
      title: true,
      details: true,
      createdAt: true,
    },
  });

  // Group similar symptoms
  const symptomGroups = new Map<string, number>();
  symptoms.forEach(s => {
    const key = s.title.toLowerCase().trim();
    symptomGroups.set(key, (symptomGroups.get(key) || 0) + 1);
  });

  // Find recurring symptoms (appeared 2+ times)
  const recurringSymptoms = Array.from(symptomGroups.entries())
    .filter(([_, count]) => count >= 2)
    .map(([symptom, _]) => symptom);

  return {
    totalSymptoms: symptoms.length,
    recurringSymptoms,
    patterns: [], // Would be populated by pattern analysis
  };
}

