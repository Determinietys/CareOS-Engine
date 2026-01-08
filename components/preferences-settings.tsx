"use client"

import { useState } from "react"
import { useTheme } from "next-themes"

interface PreferencesSettingsProps {
  user: {
    id: string
    theme: string
    language: string
    timezone: string
  }
}

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
]

const timezones = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
]

export default function PreferencesSettings({
  user: initialUser,
}: PreferencesSettingsProps) {
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState(initialUser)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme)
    setUser({ ...user, theme: newTheme })
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/settings/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to update theme")
        return
      }

      setSuccess("Theme updated successfully")
    } catch (err) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = async (newLanguage: string) => {
    setUser({ ...user, language: newLanguage })
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/settings/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: newLanguage }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to update language")
        setUser({ ...user, language: initialUser.language })
        return
      }

      setSuccess("Language updated successfully")
    } catch (err) {
      setError("An error occurred")
      setUser({ ...user, language: initialUser.language })
    } finally {
      setLoading(false)
    }
  }

  const handleTimezoneChange = async (newTimezone: string) => {
    setUser({ ...user, timezone: newTimezone })
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/settings/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: newTimezone }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to update timezone")
        setUser({ ...user, timezone: initialUser.timezone })
        return
      }

      setSuccess("Timezone updated successfully")
    } catch (err) {
      setError("An error occurred")
      setUser({ ...user, timezone: initialUser.timezone })
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
          Theme
        </label>
        <div className="flex space-x-4">
          <button
            onClick={() => handleThemeChange("light")}
            disabled={loading}
            className={`px-4 py-2 rounded-md ${
              theme === "light"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Light
          </button>
          <button
            onClick={() => handleThemeChange("dark")}
            disabled={loading}
            className={`px-4 py-2 rounded-md ${
              theme === "dark"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => handleThemeChange("system")}
            disabled={loading}
            className={`px-4 py-2 rounded-md ${
              theme === "system"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            System
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Language
        </label>
        <select
          value={user.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={loading}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Timezone
        </label>
        <select
          value={user.timezone}
          onChange={(e) => handleTimezoneChange(e.target.value)}
          disabled={loading}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {timezones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

