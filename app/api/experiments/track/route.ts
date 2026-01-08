import { NextRequest, NextResponse } from 'next/server';
import { trackExperimentMetric } from '@/lib/ab-testing';

/**
 * Track experiment metric
 */
export async function POST(req: NextRequest) {
  try {
    const { experimentId, userId, variantId, metric } = await req.json();

    if (!experimentId || !userId || !metric) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await trackExperimentMetric(experimentId, userId, metric);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking experiment metric:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

