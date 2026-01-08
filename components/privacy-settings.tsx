"use client"

import { useState } from "react"

interface PrivacySettingsProps {
  settings: {
    id: string
    profileVisibility: string
    dataSharing: boolean
    analyticsEnabled: boolean
    cookiesAccepted: boolean
  }
}

export default function PrivacySettings({
  settings: initialSettings,
}: PrivacySettingsProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleToggle = async (field: keyof typeof settings) => {
    if (field === "profileVisibility") return // Handle separately

    const newValue = !settings[field]
    setSettings({ ...settings, [field]: newValue })
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/settings/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [field]: newValue,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to update settings")
        setSettings({ ...settings, [field]: !newValue })
        return
      }

      setSuccess("Settings updated successfully")
    } catch (err) {
      setError("An error occurred")
      setSettings({ ...settings, [field]: !newValue })
    } finally {
      setLoading(false)
    }
  }

  const handleVisibilityChange = async (value: string) => {
    setSettings({ ...settings, profileVisibility: value })
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/settings/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileVisibility: value,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to update settings")
        setSettings({ ...settings, profileVisibility: initialSettings.profileVisibility })
        return
      }

      setSuccess("Settings updated successfully")
    } catch (err) {
      setError("An error occurred")
      setSettings({ ...settings, profileVisibility: initialSettings.profileVisibility })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
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

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Profile Visibility
        </label>
        <select
          value={settings.profileVisibility}
          onChange={(e) => handleVisibilityChange(e.target.value)}
          disabled={loading}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="private">Private</option>
          <option value="public">Public</option>
          <option value="friends">Friends Only</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Data Sharing
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Allow sharing of anonymized data for research purposes
          </p>
        </div>
        <button
          onClick={() => handleToggle("dataSharing")}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            settings.dataSharing ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.dataSharing ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Analytics
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Help us improve by sharing usage analytics
          </p>
        </div>
        <button
          onClick={() => handleToggle("analyticsEnabled")}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            settings.analyticsEnabled ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.analyticsEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  )
}

