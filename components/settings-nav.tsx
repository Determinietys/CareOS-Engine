"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const settingsSections = [
  { name: "Profile", href: "/settings/profile" },
  { name: "Security", href: "/settings/security" },
  { name: "Notifications", href: "/settings/notifications" },
  { name: "Privacy", href: "/settings/privacy" },
  { name: "Billing", href: "/settings/billing" },
  { name: "Preferences", href: "/settings/preferences" },
]

export default function SettingsNav() {
  const pathname = usePathname()

  return (
    <ul className="space-y-1">
      {settingsSections.map((section) => (
        <li key={section.href}>
          <Link
            href={section.href}
            className={`block px-4 py-2 rounded-md ${
              pathname === section.href
                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {section.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

