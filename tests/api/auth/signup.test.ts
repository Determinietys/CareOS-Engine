import { POST } from "@/app/api/auth/signup/route"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}))

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should create a new user successfully", async () => {
    const mockHash = jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed-password" as never)
    const mockFindUnique = jest.spyOn(prisma.user, "findUnique").mockResolvedValue(null)
    const mockCreate = jest.spyOn(prisma.user, "create").mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    } as any)

    const request = new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe("Account created successfully")
    expect(mockHash).toHaveBeenCalledWith("password123", 12)
    expect(mockCreate).toHaveBeenCalled()
  })

  it("should return error if user already exists", async () => {
    const mockFindUnique = jest.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
    } as any)

    const request = new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.code).toBe("RESOURCE_ALREADY_EXISTS")
  })

  it("should return error for invalid email", async () => {
    const request = new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "invalid-email",
        password: "password123",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe("VALIDATION_ERROR")
  })

  it("should return error for weak password", async () => {
    const request = new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        password: "short",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe("VALIDATION_ERROR")
  })
})

