"use client"

export default function DataManagement() {
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      const response = await fetch("/api/settings/privacy/delete", {
        method: "DELETE",
      })
      if (response.ok) {
        window.location.href = "/auth/signin"
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Data Management
      </h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Export Your Data
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Download a copy of all your data in JSON format
          </p>
          <a
            href="/api/settings/privacy/export"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Export Data
          </a>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
            Delete Your Account
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}

