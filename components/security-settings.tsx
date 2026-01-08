"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import MfaSetup from "@/components/mfa-setup"
import SessionsList from "@/components/sessions-list"
import LoginHistoryList from "@/components/login-history-list"

interface SecuritySettingsProps {
  user: {
    id: string
    email: string
    mfaEnabled: boolean
  }
  sessions: Array<{
    id: string
    sessionToken: string
    expires: Date
    ipAddress: string | null
    userAgent: string | null
    lastActiveAt: Date
  }>
  loginHistory: Array<{
    id: string
    ipAddress: string | null
    userAgent: string | null
    success: boolean
    failureReason: string | null
    createdAt: Date
  }>
}

export default function SecuritySettings({
  user: initialUser,
  sessions: initialSessions,
  loginHistory: initialLoginHistory,
}: SecuritySettingsProps) {
  const { data: session } = useSession()
  const [user, setUser] = useState(initialUser)
  const [sessions, setSessions] = useState(initialSessions)
  const [loginHistory] = useState(initialLoginHistory)
  const [showMfaSetup, setShowMfaSetup] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [showEmailChange, setShowEmailChange] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const response = await fetch("/api/settings/security/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.get("currentPassword"),
          newPassword: formData.get("newPassword"),
          confirmPassword: formData.get("confirmPassword"),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to change password")
        return
      }

      setSuccess("Password changed successfully")
      setShowPasswordChange(false)
      e.currentTarget.reset()
    } catch (err) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const response = await fetch("/api/settings/security/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: formData.get("newEmail"),
          password: formData.get("password"),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to change email")
        return
      }

      setSuccess("Verification email sent to new address")
      setShowEmailChange(false)
      e.currentTarget.reset()
    } catch (err) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to revoke this session?")) return

    setLoading(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        setError("Failed to revoke session")
        return
      }

      setSessions(sessions.filter((s) => s.id !== sessionId))
      setSuccess("Session revoked successfully")
    } catch (err) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Password Change */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Change Password
        </h3>
        {!showPasswordChange ? (
          <button
            onClick={() => setShowPasswordChange(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Change Password
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                required
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                required
                minLength={8}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={8}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                Update Password
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordChange(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Email Change */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Change Email
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Current email: {user.email}
        </p>
        {!showEmailChange ? (
          <button
            onClick={() => setShowEmailChange(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Change Email
          </button>
        ) : (
          <form onSubmit={handleEmailChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Email
              </label>
              <input
                type="email"
                name="newEmail"
                required
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="password"
                required
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                Send Verification Email
              </button>
              <button
                type="button"
                onClick={() => setShowEmailChange(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* MFA */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Multi-Factor Authentication
        </h3>
        {user.mfaEnabled ? (
          <div>
            <p className="text-sm text-green-600 dark:text-green-400 mb-4">
              ✓ MFA is enabled
            </p>
            <button
              onClick={() => setShowMfaSetup(true)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Reconfigure MFA
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Add an extra layer of security to your account
            </p>
            <button
              onClick={() => setShowMfaSetup(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Enable MFA
            </button>
          </div>
        )}
        {showMfaSetup && (
          <MfaSetup
            userId={user.id}
            mfaEnabled={user.mfaEnabled}
            onComplete={() => {
              setShowMfaSetup(false)
              setUser({ ...user, mfaEnabled: true })
            }}
            onCancel={() => setShowMfaSetup(false)}
          />
        )}
      </div>

      {/* Active Sessions */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Active Sessions
        </h3>
        <SessionsList
          sessions={sessions}
          currentSessionToken={undefined}
          onRevoke={handleRevokeSession}
        />
      </div>

      {/* Login History */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Login History
        </h3>
        <LoginHistoryList loginHistory={loginHistory} />
      </div>
    </div>
  )
}

