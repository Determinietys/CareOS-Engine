"use client"

import { format } from "date-fns"

interface SessionsListProps {
  sessions: Array<{
    id: string
    sessionToken: string
    expires: Date
    ipAddress: string | null
    userAgent: string | null
    lastActiveAt: Date
  }>
  currentSessionToken?: string
  onRevoke: (sessionId: string) => void
}

export default function SessionsList({
  sessions,
  currentSessionToken,
  onRevoke,
}: SessionsListProps) {
  const getDeviceInfo = (userAgent: string | null) => {
    if (!userAgent) return "Unknown device"
    
    // Simple device detection
    if (userAgent.includes("Mobile")) {
      return "Mobile device"
    } else if (userAgent.includes("Tablet")) {
      return "Tablet"
    } else {
      return "Desktop"
    }
  }

  return (
    <div className="space-y-2">
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">No active sessions</p>
      ) : (
        sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <p className="font-medium text-gray-900 dark:text-white">
                  {getDeviceInfo(session.userAgent)}
                </p>
                {currentSessionToken === session.sessionToken && (
                  <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded">
                    Current
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {session.ipAddress || "IP unknown"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Last active: {format(new Date(session.lastActiveAt), "PPp")}
              </p>
            </div>
            {currentSessionToken !== session.sessionToken && (
              <button
                onClick={() => onRevoke(session.id)}
                className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                Revoke
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}

