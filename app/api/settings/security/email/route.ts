import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling, requireAuth } from "@/lib/api/error-handler"
import { Errors } from "@/lib/errors"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import crypto from "crypto"

const emailChangeSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  password: z.string().min(1),
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
  const validation = emailChangeSchema.safeParse(body)

  if (!validation.success) {
    throw Errors.validation.error(
      "Validation failed",
      validation.error.flatten().fieldErrors
    )
  }

  const { newEmail, password } = validation.data

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, password: true },
  })

  if (!user || !user.password) {
    throw Errors.resource.notFound("User")
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    throw Errors.auth.invalidCredentials()
  }

  // Check if new email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: newEmail },
  })

  if (existingUser) {
    throw Errors.resource.alreadyExists("Email")
  }

  // Generate verification token
  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date()
  expires.setHours(expires.getHours() + 24) // 24 hours

  // Store verification token (you might want to create a separate table for this)
  // For now, we'll use a simple approach with the existing VerificationToken model
  await prisma.verificationToken.upsert({
    where: {
      identifier_token: {
        identifier: newEmail,
        token: token,
      },
    },
    update: {
      token: token,
      expires: expires,
    },
    create: {
      identifier: newEmail,
      token: token,
      expires: expires,
    },
  })

  // TODO: Send verification email
  // For now, we'll just return success
  // In production, you'd send an email with a link like:
  // /api/auth/verify-email?token=${token}&email=${newEmail}

  return NextResponse.json({
    message: "Verification email sent to new address",
    // In development, you might want to return the token for testing
    ...(process.env.NODE_ENV === "development" && { token }),
  })
}

export const POST = withErrorHandling(handler)

