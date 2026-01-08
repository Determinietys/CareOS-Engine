import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling, requireAuth } from "@/lib/api/error-handler"
import { Errors } from "@/lib/errors"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const notificationSettingsSchema = z.object({
  emailMarketing: z.boolean().optional(),
  emailTransactional: z.boolean().optional(),
  emailUpdates: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
})

async function handler(req: NextRequest) {
  const session = await requireAuth(req)

  if (req.method === "PATCH") {
    const body = await req.json()
    const validation = notificationSettingsSchema.safeParse(body)

    if (!validation.success) {
      throw Errors.validation.error(
        "Validation failed",
        validation.error.flatten().fieldErrors
      )
    }

    const settings = await prisma.notificationSettings.update({
      where: { userId: session.user.id },
      data: validation.data,
    })

    return NextResponse.json({ settings })
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export const PATCH = withErrorHandling(handler)

