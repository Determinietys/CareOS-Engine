import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling, requireAuth } from "@/lib/api/error-handler"
import { Errors } from "@/lib/errors"
import { prisma } from "@/lib/prisma"

async function handler(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await requireAuth(req)

  if (req.method !== "DELETE") {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405 }
    )
  }

  const { sessionId } = params

  // Verify session belongs to user
  const targetSession = await prisma.session.findUnique({
    where: { id: sessionId },
  })

  if (!targetSession) {
    throw Errors.resource.notFound("Session")
  }

  if (targetSession.userId !== session.user.id) {
    throw Errors.resource.accessDenied()
  }

  // Delete session
  await prisma.session.delete({
    where: { id: sessionId },
  })

  return NextResponse.json({ message: "Session revoked successfully" })
}

export const DELETE = withErrorHandling(handler)

