import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling } from "@/lib/api/error-handler"
import { Errors } from "@/lib/errors"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405 }
    )
  }

  const body = await req.json()
  const validation = signupSchema.safeParse(body)

  if (!validation.success) {
    throw Errors.validation.error(
      "Validation failed",
      validation.error.flatten().fieldErrors
    )
  }

  const { name, email, password } = validation.data

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw Errors.resource.alreadyExists("User")
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      notificationSettings: {
        create: {},
      },
      privacySettings: {
        create: {},
      },
      subscription: {
        create: {
          tier: "free",
          status: "active",
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })

  return NextResponse.json(
    { message: "Account created successfully", user },
    { status: 201 }
  )
}

export const POST = withErrorHandling(handler)

