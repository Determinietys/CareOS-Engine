import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling, requireAuth } from "@/lib/api/error-handler"
import { Errors } from "@/lib/errors"
import { z } from "zod"

const captureSchema = z.object({
  text: z.string().min(1, "Text is required"),
})

/**
 * AI Classification endpoint for CareOS Quick Capture
 * This would integrate with Claude API or your AI service
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

  // TODO: Integrate with Claude API or your AI classification service
  // For now, return a simple classification
  const classification = {
    category: "task", // Would come from AI
    title: text.substring(0, 50),
    details: text.length > 50 ? text.substring(50) : "",
    person: null,
    urgency: "low" as const,
    suggestedAction: "Review and organize",
    entities: [],
    sentiment: "neutral" as const,
    requiresExpert: false,
  }

  // TODO: Save to database
  // await prisma.capturedItem.create({ ... })

  return NextResponse.json({
    success: true,
    classification,
  })
}

export const POST = withErrorHandling(handler)

