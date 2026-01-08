"use client"

import { useState, useEffect } from "react"
import { toDataURL } from "qrcode"

interface MfaSetupProps {
  userId: string
  mfaEnabled: boolean
  onComplete: () => void
  onCancel: () => void
}

export default function MfaSetup({
  userId,
  mfaEnabled,
  onComplete,
  onCancel,
}: MfaSetupProps) {
  const [qrCode, setQrCode] = useState("")
  const [secret, setSecret] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState<"setup" | "verify">("setup")

  useEffect(() => {
    if (step === "setup") {
      fetchMfaSecret()
    }
  }, [step])

  const fetchMfaSecret = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/mfa/setup")
      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to setup MFA")
        return
      }

      setSecret(data.secret)
      const qr = await toDataURL(data.qrCodeUrl)
      setQrCode(qr)
    } catch (err) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: verificationCode,
          secret,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Invalid code")
        return
      }

      onComplete()
    } catch (err) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (step === "setup") {
    return (
      <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Setup Multi-Factor Authentication
        </h4>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
              </div>
            )}
            {secret && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Or enter this code manually:
                </p>
                <code className="block p-2 bg-white dark:bg-gray-800 border rounded text-center font-mono">
                  {secret}
                </code>
              </div>
            )}
            <div className="flex space-x-2">
              <button
                onClick={() => setStep("verify")}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                I've scanned the code
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Verify MFA Setup
      </h4>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter the 6-digit code from your authenticator app
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
            required
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl tracking-widest"
            placeholder="000000"
          />
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={loading || verificationCode.length !== 6}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & Enable"}
          </button>
          <button
            type="button"
            onClick={() => setStep("setup")}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  )
}

