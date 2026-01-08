import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling, requireAuth } from "@/lib/api/error-handler"
import { Errors } from "@/lib/errors"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
})

async function handler(req: NextRequest) {
  const session = await requireAuth(req)

  if (req.method === "PATCH") {
    const body = await req.json()
    const validation = preferencesSchema.safeParse(body)

    if (!validation.success) {
      throw Errors.validation.error(
        "Validation failed",
        validation.error.flatten().fieldErrors
      )
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: validation.data,
      select: {
        id: true,
        theme: true,
        language: true,
        timezone: true,
      },
    })

    return NextResponse.json({ user })
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export const PATCH = withErrorHandling(handler)

