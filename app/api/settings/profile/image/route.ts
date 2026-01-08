import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling, requireAuth } from "@/lib/api/error-handler"
import { Errors } from "@/lib/errors"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

async function handler(req: NextRequest) {
  const session = await requireAuth(req)

  if (req.method !== "POST") {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405 }
    )
  }

  const formData = await req.formData()
  const file = formData.get("image") as File

  if (!file) {
    throw Errors.validation.error("No image file provided")
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw Errors.validation.error("File must be an image")
  }

  // Validate file size (2MB)
  if (file.size > 2 * 1024 * 1024) {
    throw Errors.validation.error("Image must be less than 2MB")
  }

  // Save file
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadsDir = join(process.cwd(), "public", "uploads", "profiles")
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true })
  }

  const filename = `${session.user.id}-${Date.now()}.${file.name.split(".").pop()}`
  const filepath = join(uploadsDir, filename)

  await writeFile(filepath, buffer)

  const imageUrl = `/uploads/profiles/${filename}`

  // Update user
  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl },
  })

  return NextResponse.json({ imageUrl })
}

export const POST = withErrorHandling(handler)

