import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling, requireAuth } from "@/lib/api/error-handler"
import { prisma } from "@/lib/prisma"

async function handler(req: NextRequest) {
  const session = await requireAuth(req)

  if (req.method !== "GET") {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405 }
    )
  }

  // Fetch all user data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts: true,
      sessions: true,
      loginHistory: true,
      notificationSettings: true,
      privacySettings: true,
      subscription: {
        include: {
          invoices: true,
        },
      },
      notifications: true,
    },
  })

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    )
  }

  // Remove sensitive data
  const exportData = {
    ...user,
    password: undefined,
    mfaSecret: undefined,
    mfaBackupCodes: undefined,
  }

  return NextResponse.json(exportData, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="careos-export-${Date.now()}.json"`,
    },
  })
}

export const GET = withErrorHandling(handler)

