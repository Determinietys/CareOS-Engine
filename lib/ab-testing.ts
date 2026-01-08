import { createHash } from 'crypto';
import { prisma } from './prisma';

export interface Experiment {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: Array<{
    id: string;
    name: string;
    weight: number; // percentage (sum to 100)
    content: Record<string, string>; // language -> message
  }>;
  metrics: string[];
}

// Experiment configurations
export const EXPERIMENTS: Record<string, Experiment> = {
  'onboarding-consent-v2': {
    id: 'onboarding-consent-v2',
    name: 'Consent Message Optimization',
    status: 'running',
    metrics: ['consent_rate', 'time_to_consent', 'completion_rate'],
    variants: [
      {
        id: 'control',
        name: 'Control',
        weight: 34,
        content: {
          en: `👋 Welcome to CareOS!

By continuing, you agree to receive SMS messages for care coordination.

Msg & data rates may apply.
Reply STOP anytime to opt out.

Reply YES to continue.`,
        },
      },
      {
        id: 'shorter',
        name: 'Shorter',
        weight: 33,
        content: {
          en: `👋 Welcome to CareOS!

We'll text you care updates & reminders.
Msg rates may apply. Reply STOP anytime.

Reply YES to start.`,
        },
      },
      {
        id: 'benefit-focused',
        name: 'Benefit Focused',
        weight: 33,
        content: {
          en: `👋 Welcome to CareOS!

Join 50,000+ families organizing care by text.
Track health, manage tasks, coordinate family.

Reply YES to get started free.
(Reply STOP anytime. Msg rates apply.)`,
        },
      },
    ],
  },
  
  'cta-button-style': {
    id: 'cta-button-style',
    name: 'CTA Button Text',
    status: 'running',
    metrics: ['click_rate', 'signup_started', 'signup_completed'],
    variants: [
      { 
        id: 'open-messages', 
        name: 'Open Messages', 
        weight: 25, 
        content: { buttonText: 'Open Messages' } 
      },
      { 
        id: 'text-us-now', 
        name: 'Text Us Now', 
        weight: 25, 
        content: { buttonText: 'Text Us Now' } 
      },
      { 
        id: 'start-texting', 
        name: 'Start Texting', 
        weight: 25, 
        content: { buttonText: 'Start Texting' } 
      },
      { 
        id: 'get-started', 
        name: 'Get Started Free', 
        weight: 25, 
        content: { buttonText: 'Get Started Free' } 
      },
    ],
  },
};

/**
 * Assign variant deterministically based on user ID
 */
export async function assignVariant(
  experimentId: string,
  userId: string
): Promise<{ id: string; name: string; content: Record<string, string> } | null> {
  const experiment = EXPERIMENTS[experimentId];
  if (!experiment || experiment.status !== 'running') {
    return null;
  }

  // Check existing assignment
  const existing = await prisma.experimentAssignment.findFirst({
    where: { experimentId, userId },
  });

  if (existing) {
    const variant = experiment.variants.find((v) => v.id === existing.variantId);
    return variant || null;
  }

  // Deterministic assignment based on hash
  const hash = createHash('md5').update(userId + experimentId).digest('hex');
  const bucket = parseInt(hash.slice(0, 8), 16) % 100;

  let cumulative = 0;
  let selectedVariant = experiment.variants[0]; // fallback

  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      selectedVariant = variant;
      break;
    }
  }

  // Store assignment
  await prisma.experimentAssignment.create({
    data: {
      experimentId,
      userId,
      variantId: selectedVariant.id,
    },
  });

  return selectedVariant;
}

/**
 * Get experiment content with replacements
 */
export async function getExperimentContent(
  experimentId: string,
  userId: string,
  language: string = 'en',
  replacements: Record<string, string> = {}
): Promise<string | null> {
  const variant = await assignVariant(experimentId, userId);
  if (!variant) return null;

  let content = variant.content[language] || variant.content.en || '';
  if (!content) return null;

  // Apply replacements (e.g., {{name}} -> "María")
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return content;
}

/**
 * Track experiment metric
 */
export async function trackExperimentMetric(
  experimentId: string,
  userId: string,
  metric: string,
  value: number = 1
): Promise<void> {
  const assignment = await prisma.experimentAssignment.findFirst({
    where: { experimentId, userId },
  });

  if (!assignment) {
    // Create assignment if it doesn't exist
    await assignVariant(experimentId, userId);
    return;
  }

  await prisma.experimentMetric.create({
    data: {
      experimentId,
      variantId: assignment.variantId,
      userId,
      metric,
      value,
    },
  });
}

/**
 * Get experiment results
 */
export async function getExperimentResults(experimentId: string): Promise<{
  variants: Array<{
    id: string;
    name: string;
    metrics: Record<string, { total: number; count: number; average: number }>;
  }>;
}> {
  const experiment = EXPERIMENTS[experimentId];
  if (!experiment) {
    throw new Error('Experiment not found');
  }

  const metrics = await prisma.experimentMetric.findMany({
    where: { experimentId },
  });

  const variantResults: Record<string, Record<string, { total: number; count: number }>> = {};

  for (const metric of metrics) {
    if (!variantResults[metric.variantId]) {
      variantResults[metric.variantId] = {};
    }
    if (!variantResults[metric.variantId][metric.metric]) {
      variantResults[metric.variantId][metric.metric] = { total: 0, count: 0 };
    }
    variantResults[metric.variantId][metric.metric].total += metric.value;
    variantResults[metric.variantId][metric.metric].count += 1;
  }

  return {
    variants: experiment.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      metrics: Object.fromEntries(
        experiment.metrics.map((metricName) => {
          const data = variantResults[variant.id]?.[metricName] || { total: 0, count: 0 };
          return [
            metricName,
            {
              total: data.total,
              count: data.count,
              average: data.count > 0 ? data.total / data.count : 0,
            },
          ];
        })
      ),
    })),
  };
}

