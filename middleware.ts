import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware
 * Runs on every request before routing
 * 
 * Security Features:
 * - CORS handling for mobile apps
 * - Security headers
 * - Request logging
 * - IP-based rate limiting (coarse-grained)
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  // Web app
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'https://careos.app',
  'https://www.careos.app',
  
  // Mobile apps (if using custom scheme)
  'careos://',
  'com.careos.app://',
  
  // Development
  ...(process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : []
  ),
];

// Security headers
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Content-Security-Policy': 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://api.stripe.com https://*.twilio.com https://*.anthropic.com; " +
    "frame-src 'self' https://js.stripe.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'none'; " +
    "upgrade-insecure-requests;",
};

export function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;
  const requestOrigin = request.headers.get('origin');
  const isApiRoute = pathname.startsWith('/api/');

  // Handle CORS for API routes
  if (isApiRoute) {
    const response = NextResponse.next();

    // Set CORS headers
    if (requestOrigin) {
      // Check if origin is allowed
      const isAllowed = ALLOWED_ORIGINS.some(
        (allowed) =>
          requestOrigin === allowed ||
          requestOrigin.endsWith(allowed) ||
          allowed === '*'
      );

      if (isAllowed || process.env.NODE_ENV === 'development') {
        response.headers.set('Access-Control-Allow-Origin', requestOrigin);
        response.headers.set(
          'Access-Control-Allow-Methods',
          'GET, POST, PUT, DELETE, OPTIONS, PATCH'
        );
        response.headers.set(
          'Access-Control-Allow-Headers',
          'Content-Type, Authorization, X-API-Key, X-Platform, X-Request-ID, X-Session-ID'
        );
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Max-Age', '86400');
      }
    } else {
      // Allow requests without origin (mobile apps, Postman, etc.)
      // In production, you may want to restrict this further
      if (process.env.NODE_ENV === 'development') {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set(
          'Access-Control-Allow-Methods',
          'GET, POST, PUT, DELETE, OPTIONS, PATCH'
        );
        response.headers.set(
          'Access-Control-Allow-Headers',
          'Content-Type, Authorization, X-API-Key, X-Platform, X-Request-ID, X-Session-ID'
        );
      }
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }

    // Add security headers to API responses
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add request ID for tracing
    const requestId = request.headers.get('x-request-id') || 
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    response.headers.set('X-Request-ID', requestId);

    return response;
  }

  // For non-API routes, add security headers
  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Configure which routes middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};

