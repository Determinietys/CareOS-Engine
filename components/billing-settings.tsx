"use client"

import { format } from "date-fns"

interface BillingSettingsProps {
  subscription: {
    id: string
    tier: string
    status: string
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd: boolean
    invoices: Array<{
      id: string
      amount: number
      currency: string
      status: string
      createdAt: Date
    }>
  }
}

const tiers = [
  { value: "free", label: "Free", price: "$0/month" },
  { value: "basic", label: "Basic", price: "$9.99/month" },
  { value: "premium", label: "Premium", price: "$29.99/month" },
]

export default function BillingSettings({ subscription }: BillingSettingsProps) {
  const currentTier = tiers.find((t) => t.value === subscription.tier)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Current Plan
        </h3>
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {currentTier?.label || subscription.tier}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentTier?.price}
              </p>
              {subscription.currentPeriodEnd && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Renews on {format(new Date(subscription.currentPeriodEnd), "PP")}
                </p>
              )}
            </div>
            <span
              className={`px-3 py-1 text-sm rounded ${
                subscription.status === "active"
                  ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
              }`}
            >
              {subscription.status}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Change Plan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.value}
              className={`border rounded-lg p-4 ${
                subscription.tier === tier.value
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <h4 className="font-medium text-gray-900 dark:text-white">
                {tier.label}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {tier.price}
              </p>
              {subscription.tier !== tier.value && (
                <button
                  className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                >
                  Upgrade
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {subscription.cancelAtPeriodEnd && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded">
          Your subscription will be canceled at the end of the current billing period.
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Invoice History
        </h3>
        {subscription.invoices.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No invoices yet</p>
        ) : (
          <div className="space-y-2">
            {subscription.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(invoice.createdAt), "PP")}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ${(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-sm rounded ${
                    invoice.status === "paid"
                      ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

