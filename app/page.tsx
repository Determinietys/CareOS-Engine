import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Welcome to CareOS Engine</h1>
        <p className="text-lg mb-8">Your secure AI-driven system dashboard</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/settings"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <h2 className="text-xl font-semibold mb-2">Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account, profile, and preferences
            </p>
          </Link>
          
          <Link
            href="/dashboard"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400">
              View your activity and system status
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}

