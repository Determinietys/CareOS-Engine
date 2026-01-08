"use client"

import dynamic from "next/dynamic"

// Dynamically import the unified CareOS component
const CareOSUnified = dynamic(() => import("@/components/careos-unified"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
        <p className="text-stone-600">Loading CareOS...</p>
      </div>
    </div>
  ),
})

export default function CareOSUnifiedPage() {
  return <CareOSUnified />
}

