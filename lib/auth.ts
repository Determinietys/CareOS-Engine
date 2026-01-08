import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { verifyTOTP } from "otplib"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mfaCode: { label: "MFA Code", type: "text", required: false },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // Normalize email for lookup (case-insensitive)
          const normalizedEmail = credentials.email.toLowerCase().trim()

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          })

          if (!user || !user.password) {
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isValid) {
            // Log failed login attempt (non-blocking)
            prisma.loginHistory.create({
              data: {
                userId: user.id,
                success: false,
                failureReason: "Invalid password",
              },
            }).catch((err) => {
              console.error("Failed to log login history:", err)
            })
            return null
          }

          // Check MFA if enabled
          if (user.mfaEnabled) {
            if (!credentials.mfaCode) {
              throw new Error("MFA code required")
            }

            if (!user.mfaSecret) {
              throw new Error("MFA not properly configured")
            }

            const isValidMFA = verifyTOTP(credentials.mfaCode, user.mfaSecret)
            if (!isValidMFA) {
              // Check backup codes
              const backupCodeIndex = user.mfaBackupCodes.indexOf(credentials.mfaCode)
              if (backupCodeIndex === -1) {
                prisma.loginHistory.create({
                  data: {
                    userId: user.id,
                    success: false,
                    failureReason: "Invalid MFA code",
                  },
                }).catch((err) => {
                  console.error("Failed to log login history:", err)
                })
                throw new Error("Invalid MFA code")
              }
              // Remove used backup code
              const updatedBackupCodes = [...user.mfaBackupCodes]
              updatedBackupCodes.splice(backupCodeIndex, 1)
              await prisma.user.update({
                where: { id: user.id },
                data: { mfaBackupCodes: updatedBackupCodes },
              })
            }
          }

          // Log successful login (non-blocking)
          prisma.loginHistory.create({
            data: {
              userId: user.id,
              success: true,
            },
          }).catch((err) => {
            console.error("Failed to log login history:", err)
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          // Re-throw MFA errors so they can be handled specially
          if (error instanceof Error && (
            error.message === "MFA code required" ||
            error.message === "MFA not properly configured" ||
            error.message === "Invalid MFA code"
          )) {
            throw error
          }
          // For other errors, return null (invalid credentials)
          console.error("Auth error:", error)
          return null
        }
      },
    }),
    // Only enable Google OAuth if credentials are provided and not empty
    ...(process.env.GOOGLE_CLIENT_ID && 
        process.env.GOOGLE_CLIENT_SECRET && 
        process.env.GOOGLE_CLIENT_ID.trim() !== "" && 
        process.env.GOOGLE_CLIENT_SECRET.trim() !== ""
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  events: {
    async signIn({ user, account }) {
      // Update last active time for session
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { updatedAt: new Date() },
        })
      }
    },
  },
}

