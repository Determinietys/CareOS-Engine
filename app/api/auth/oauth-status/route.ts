import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || ""
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || ""
  
  const isGoogleOAuthEnabled = !!(
    clientId && 
    clientSecret &&
    clientId !== "" &&
    clientSecret !== ""
  )

  return NextResponse.json({ 
    google: isGoogleOAuthEnabled 
  })
}

