import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling, requireAuth } from "@/lib/api/error-handler"
import { Errors } from "@/lib/errors"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const privacySettingsSchema = z.object({
  profileVisibility: z.enum(["private", "public", "friends"]).optional(),
  dataSharing: z.boolean().optional(),
  analyticsEnabled: z.boolean().optional(),
  cookiesAccepted: z.boolean().optional(),
})

async function handler(req: NextRequest) {
  const session = await requireAuth(req)

  if (req.method === "PATCH") {
    const body = await req.json()
    const validation = privacySettingsSchema.safeParse(body)

    if (!validation.success) {
      throw Errors.validation.error(
        "Validation failed",
        validation.error.flatten().fieldErrors
      )
    }

    const data: any = validation.data
    if (data.cookiesAccepted) {
      data.cookiesAcceptedAt = new Date()
    }

    const settings = await prisma.privacySettings.update({
      where: { userId: session.user.id },
      data,
    })

    return NextResponse.json({ settings })
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export const PATCH = withErrorHandling(handler)

