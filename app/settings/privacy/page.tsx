import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import PrivacySettings from "@/components/privacy-settings"
import SettingsNav from "@/components/settings-nav"
import DataManagement from "@/components/data-management"

export default async function PrivacyPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const settings = await prisma.privacySettings.findUnique({
    where: { userId: session.user.id },
  })

  if (!settings) {
    await prisma.privacySettings.create({
      data: { userId: session.user.id },
    })
    redirect("/settings/privacy")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Settings
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <nav className="lg:col-span-1">
            <SettingsNav />
          </nav>
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Privacy Settings
              </h2>
              <PrivacySettings settings={settings} />
            </div>
            <DataManagement />
          </div>
        </div>
      </div>
    </div>
  )
}

