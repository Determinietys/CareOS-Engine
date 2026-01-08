import { AppError, Errors, ErrorCode, ErrorCategory, errorToResponse } from "@/lib/errors"

describe("Error Handling", () => {
  describe("AppError", () => {
    it("should create an error with all properties", () => {
      const error = new AppError(
        ErrorCode.AUTH_REQUIRED,
        ErrorCategory.AUTHENTICATION,
        "Authentication required",
        401
      )

      expect(error.code).toBe(ErrorCode.AUTH_REQUIRED)
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION)
      expect(error.message).toBe("Authentication required")
      expect(error.statusCode).toBe(401)
      expect(error.timestamp).toBeDefined()
    })

    it("should convert to domain error", () => {
      const error = new AppError(
        ErrorCode.AUTH_REQUIRED,
        ErrorCategory.AUTHENTICATION,
        "Authentication required",
        401
      )

      const domainError = error.toDomainError()

      expect(domainError.code).toBe(ErrorCode.AUTH_REQUIRED)
      expect(domainError.category).toBe(ErrorCategory.AUTHENTICATION)
      expect(domainError.message).toBe("Authentication required")
      expect(domainError.timestamp).toBeDefined()
    })
  })

  describe("Error Factory", () => {
    it("should create auth required error", () => {
      const error = Errors.auth.required()
      expect(error.code).toBe(ErrorCode.AUTH_REQUIRED)
      expect(error.statusCode).toBe(401)
    })

    it("should create invalid credentials error", () => {
      const error = Errors.auth.invalidCredentials()
      expect(error.code).toBe(ErrorCode.AUTH_INVALID_CREDENTIALS)
      expect(error.statusCode).toBe(401)
    })

    it("should create validation error with details", () => {
      const details = { email: "Invalid email" }
      const error = Errors.validation.error("Validation failed", details)
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.statusCode).toBe(400)
      expect(error.details).toEqual(details)
    })

    it("should create resource not found error", () => {
      const error = Errors.resource.notFound("User")
      expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
      expect(error.message).toBe("User not found")
      expect(error.statusCode).toBe(404)
    })
  })

  describe("errorToResponse", () => {
    it("should convert AppError to response", () => {
      const error = Errors.auth.required()
      const response = errorToResponse(error, "req-123")

      expect(response.status).toBe(401)
      expect(response.body.code).toBe(ErrorCode.AUTH_REQUIRED)
      expect(response.body.requestId).toBe("req-123")
    })

    it("should handle unknown errors", () => {
      const unknownError = new Error("Unknown error")
      const response = errorToResponse(unknownError)

      expect(response.status).toBe(500)
      expect(response.body.code).toBe(ErrorCode.INTERNAL_ERROR)
    })
  })
})

