import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling, requireAuth } from "@/lib/api/error-handler"
import { Errors } from "@/lib/errors"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
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
  const validation = passwordChangeSchema.safeParse(body)

  if (!validation.success) {
    throw Errors.validation.error(
      "Validation failed",
      validation.error.flatten().fieldErrors
    )
  }

  const { currentPassword, newPassword } = validation.data

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })

  if (!user || !user.password) {
    throw Errors.resource.notFound("User")
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.password)
  if (!isValid) {
    throw Errors.auth.invalidCredentials()
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12)

  // Update password
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  })

  return NextResponse.json({ message: "Password changed successfully" })
}

export const POST = withErrorHandling(handler)

