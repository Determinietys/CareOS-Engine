/**
 * API Error Handling Architecture
 * 
 * Domain Truth: Canonical error codes and categories
 * Boundary Translation: Map domain errors to transport-specific responses
 * Enforced Consistency: Single choke point for all errors
 */

export enum ErrorCode {
  // Authentication errors (1xxx)
  AUTH_REQUIRED = "AUTH_REQUIRED",
  AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",
  AUTH_MFA_REQUIRED = "AUTH_MFA_REQUIRED",
  AUTH_MFA_INVALID = "AUTH_MFA_INVALID",
  AUTH_SESSION_EXPIRED = "AUTH_SESSION_EXPIRED",
  AUTH_ACCOUNT_LOCKED = "AUTH_ACCOUNT_LOCKED",
  
  // Validation errors (2xxx)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  VALIDATION_EMAIL_INVALID = "VALIDATION_EMAIL_INVALID",
  VALIDATION_PASSWORD_WEAK = "VALIDATION_PASSWORD_WEAK",
  VALIDATION_REQUIRED_FIELD = "VALIDATION_REQUIRED_FIELD",
  
  // Resource errors (3xxx)
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",
  RESOURCE_ACCESS_DENIED = "RESOURCE_ACCESS_DENIED",
  
  // System errors (5xxx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  
  // Rate limiting (4xxx)
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}

export enum ErrorCategory {
  AUTHENTICATION = "AUTHENTICATION",
  VALIDATION = "VALIDATION",
  RESOURCE = "RESOURCE",
  SYSTEM = "SYSTEM",
  RATE_LIMIT = "RATE_LIMIT",
}

export interface DomainError {
  code: ErrorCode
  category: ErrorCategory
  message: string
  details?: Record<string, unknown>
  timestamp: string
  requestId?: string
}

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly category: ErrorCategory
  public readonly details?: Record<string, unknown>
  public readonly statusCode: number
  public readonly timestamp: string
  public readonly requestId?: string

  constructor(
    code: ErrorCode,
    category: ErrorCategory,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message)
    this.name = "AppError"
    this.code = code
    this.category = category
    this.details = details
    this.statusCode = statusCode
    this.timestamp = new Date().toISOString()
    this.requestId = requestId

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  toDomainError(): DomainError {
    return {
      code: this.code,
      category: this.category,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
    }
  }
}

// Error factory functions for common errors
export const Errors = {
  auth: {
    required: () => new AppError(
      ErrorCode.AUTH_REQUIRED,
      ErrorCategory.AUTHENTICATION,
      "Authentication required",
      401
    ),
    invalidCredentials: () => new AppError(
      ErrorCode.AUTH_INVALID_CREDENTIALS,
      ErrorCategory.AUTHENTICATION,
      "Invalid email or password",
      401
    ),
    mfaRequired: () => new AppError(
      ErrorCode.AUTH_MFA_REQUIRED,
      ErrorCategory.AUTHENTICATION,
      "Multi-factor authentication required",
      401
    ),
    mfaInvalid: () => new AppError(
      ErrorCode.AUTH_MFA_INVALID,
      ErrorCategory.AUTHENTICATION,
      "Invalid MFA code",
      401
    ),
  },
  validation: {
    error: (message: string, details?: Record<string, unknown>) => new AppError(
      ErrorCode.VALIDATION_ERROR,
      ErrorCategory.VALIDATION,
      message,
      400,
      details
    ),
    emailInvalid: () => new AppError(
      ErrorCode.VALIDATION_EMAIL_INVALID,
      ErrorCategory.VALIDATION,
      "Invalid email address",
      400
    ),
    passwordWeak: () => new AppError(
      ErrorCode.VALIDATION_PASSWORD_WEAK,
      ErrorCategory.VALIDATION,
      "Password does not meet security requirements",
      400
    ),
  },
  resource: {
    notFound: (resource: string) => new AppError(
      ErrorCode.RESOURCE_NOT_FOUND,
      ErrorCategory.RESOURCE,
      `${resource} not found`,
      404
    ),
    alreadyExists: (resource: string) => new AppError(
      ErrorCode.RESOURCE_ALREADY_EXISTS,
      ErrorCategory.RESOURCE,
      `${resource} already exists`,
      409
    ),
    accessDenied: () => new AppError(
      ErrorCode.RESOURCE_ACCESS_DENIED,
      ErrorCategory.RESOURCE,
      "Access denied",
      403
    ),
  },
  system: {
    internal: (message?: string) => new AppError(
      ErrorCode.INTERNAL_ERROR,
      ErrorCategory.SYSTEM,
      message || "An internal error occurred",
      500
    ),
    database: (message?: string) => new AppError(
      ErrorCode.DATABASE_ERROR,
      ErrorCategory.SYSTEM,
      message || "Database error occurred",
      500
    ),
  },
}

/**
 * Boundary Translation: Convert domain errors to HTTP responses
 */
export function errorToResponse(error: unknown, requestId?: string): {
  status: number
  body: DomainError
} {
  if (error instanceof AppError) {
    if (requestId) {
      error.requestId = requestId
    }
    return {
      status: error.statusCode,
      body: error.toDomainError(),
    }
  }

  // Unknown errors become internal errors
  const unknownError = Errors.system.internal(
    error instanceof Error ? error.message : "Unknown error"
  )
  if (requestId) {
    unknownError.requestId = requestId
  }
  return {
    status: 500,
    body: unknownError.toDomainError(),
  }
}

