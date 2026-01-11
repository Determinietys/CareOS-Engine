import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling, requireAuth } from "@/lib/api/error-handler"
import { Errors } from "@/lib/errors"
import { z } from "zod"
import { classifyWithHealthCorrelation } from "@/lib/health-correlation"
import { prisma } from "@/lib/prisma"

const captureSchema = z.object({
  text: z.string().min(1, "Text is required"),
})

/**
 * AI Classification endpoint for CareOS Quick Capture
 * Now with health correlation - links symptoms with medical history
 */
async function handler(req: NextRequest) {
  const session = await requireAuth(req)

  if (req.method !== "POST") {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405 }
    )
  }

  const body = await req.json()
  const validation = captureSchema.safeParse(body)

  if (!validation.success) {
    throw Errors.validation.error(
      "Validation failed",
      validation.error.flatten().fieldErrors
    )
  }

  const { text } = validation.data

  // Get user for context
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, language: true },
  })

  // Classify with health correlation
  const classification = await classifyWithHealthCorrelation(
    text,
    session.user.id,
    user?.name || null,
    user?.language || 'en'
  )

  // Build details with pattern and tracking information
  let capturedDetails = classification.details;
  
  // Add correlations if any
  if (classification.correlations && classification.correlations.length > 0) {
    const correlationDetails = classification.correlations.map(corr => 
      `${corr.currentSymptom} → ${corr.relatedHistory}: ${corr.possibleConnection}`
    ).join(' | ');
    capturedDetails = `${capturedDetails}\n\nCorrelations: ${correlationDetails}`;
  }
  
  // Add pattern information if detected
  if (classification.isPatternDetected && classification.patternInfo) {
    capturedDetails += `\n\n⚠️ Pattern detected: ${classification.patternInfo}`;
    capturedDetails += `\n\nThis symptom is being tracked to identify if it's part of a larger recurring issue.`;
  }
  
  // Add suggested checks and actions
  if (classification.suggestedChecks && classification.suggestedChecks.length > 0) {
    capturedDetails += `\n\nSuggested checks: ${classification.suggestedChecks.join(', ')}`;
  }
  if (classification.suggestedActions && classification.suggestedActions.length > 0) {
    capturedDetails += `\n\nSuggested actions: ${classification.suggestedActions.join(', ')}`;
  }
  
  // Always note that it's logged for tracking
  capturedDetails += `\n\n✓ Logged in profile for pattern tracking`;

  // Save to database
  const capturedItem = await prisma.capturedItem.create({
    data: {
      userId: session.user.id,
      category: classification.category,
      title: classification.title,
      details: capturedDetails,
      urgency: classification.urgency,
      originalText: text,
      language: user?.language || 'en',
      source: 'app',
    },
  })

  return NextResponse.json({
    success: true,
    classification: {
      ...classification,
      id: capturedItem.id,
      createdAt: capturedItem.createdAt,
    },
  })
}

export const POST = withErrorHandling(handler)

