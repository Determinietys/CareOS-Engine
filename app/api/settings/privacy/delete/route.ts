import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling, requireAuth } from "@/lib/api/error-handler"
import { prisma } from "@/lib/prisma"

async function handler(req: NextRequest) {
  const session = await requireAuth(req)

  if (req.method !== "DELETE") {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405 }
    )
  }

  // Delete user (cascades to all related data)
  await prisma.user.delete({
    where: { id: session.user.id },
  })

  return NextResponse.json({ message: "Account deleted successfully" })
}

export const DELETE = withErrorHandling(handler)

