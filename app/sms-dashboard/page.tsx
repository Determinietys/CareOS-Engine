'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CapturedItem {
  id: string;
  category: string;
  title: string;
  details: string | null;
  person: string | null;
  urgency: string;
  createdAt: string;
}

export default function SMSDashboard() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<CapturedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch captured items
      fetch('/api/sms/captured-items')
        .then((res) => res.json())
        .then((data) => {
          setItems(data.items || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CapturedItem[]>);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            CareOS Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your health timeline and captured items
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No items captured yet. Start texting to see your health timeline!
            </p>
            <Link
              href="/"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              View SMS number →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 capitalize">
                  {category}
                </h2>
                <div className="space-y-4">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="border-l-4 border-blue-500 pl-4 py-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {item.title}
                          </h3>
                          {item.details && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {item.details}
                            </p>
                          )}
                          {item.person && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Person: {item.person}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 text-right">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              item.urgency === 'high'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : item.urgency === 'medium'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                          >
                            {item.urgency}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

