import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling, requireAuth } from "@/lib/api/error-handler"
import { Errors } from "@/lib/errors"
import { prisma } from "@/lib/prisma"
import { authenticator } from "otplib"
import { z } from "zod"

const verifySchema = z.object({
  code: z.string().length(6),
  secret: z.string(),
})

async function handler(req: NextRequest) {
  const session = await requireAuth(req)

  if (req.method !== "POST") {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405 }
    )
  }

  const body = await req.json()
  const validation = verifySchema.safeParse(body)

  if (!validation.success) {
    throw Errors.validation.error(
      "Validation failed",
      validation.error.flatten().fieldErrors
    )
  }

  const { code, secret } = validation.data

  // Verify code
  const isValid = authenticator.verify({ token: code, secret })

  if (!isValid) {
    throw Errors.auth.mfaInvalid()
  }

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  )

  // Update user
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      mfaEnabled: true,
      mfaSecret: secret,
      mfaBackupCodes: backupCodes,
    },
  })

  return NextResponse.json({
    message: "MFA enabled successfully",
    backupCodes, // Show these to the user once
  })
}

export const POST = withErrorHandling(handler)

