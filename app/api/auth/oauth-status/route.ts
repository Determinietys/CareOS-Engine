import { NextResponse } from "next/server"

export async function GET() {
  const isGoogleOAuthEnabled = !!(
    process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID !== "" &&
    process.env.GOOGLE_CLIENT_SECRET !== ""
  )

  return NextResponse.json({ 
    google: isGoogleOAuthEnabled 
  })
}

