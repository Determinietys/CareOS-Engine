/**
 * Single choke point for API error handling
 * All API routes should use this handler
 */

import { NextRequest, NextResponse } from "next/server"
import { errorToResponse, AppError } from "@/lib/errors"
import { prisma } from "@/lib/prisma"

export async function handleApiError(
  request: NextRequest,
  error: unknown
): Promise<NextResponse> {
  // Generate request ID for tracing
  const requestId = request.headers.get("x-request-id") || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Log error for auditability
  console.error("[API Error]", {
    requestId,
    url: request.url,
    method: request.method,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  })

  // Convert to response
  const { status, body } = errorToResponse(error, requestId)

  return NextResponse.json(body, { status })
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandling(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context)
    } catch (error) {
      return handleApiError(req, error)
    }
  }
}

/**
 * Ensure user is authenticated
 */
export async function requireAuth(request: NextRequest) {
  const { getServerSession } = await import("next-auth")
  const { authOptions } = await import("@/lib/auth")
  const { Errors } = await import("@/lib/errors")
  
  const session = await getServerSession(authOptions)

  if (!session) {
    throw Errors.auth.required()
  }

  return session
}

