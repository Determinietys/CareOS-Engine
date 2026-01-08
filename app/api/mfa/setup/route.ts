import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling, requireAuth } from "@/lib/api/error-handler"
import { prisma } from "@/lib/prisma"
import { authenticator } from "otplib"
import { toDataURL } from "qrcode"

async function handler(req: NextRequest) {
  const session = await requireAuth(req)

  if (req.method !== "GET") {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    )
  }

  // Generate secret
  const secret = authenticator.generateSecret()
  const serviceName = "CareOS Engine"
  const accountName = user.email

  const otpAuthUrl = authenticator.keyuri(accountName, serviceName, secret)

  // Generate QR code
  const qrCodeUrl = await toDataURL(otpAuthUrl)

  return NextResponse.json({
    secret,
    qrCodeUrl,
  })
}

export const GET = withErrorHandling(handler)

