'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [region, setRegion] = useState('us');

  const phoneNumbers: Record<string, { sms?: string; whatsapp?: string }> = {
    us: { sms: '+1 (555) 123-4567', whatsapp: '+1 (555) 123-4567' },
    uk: { sms: '+44 20 1234 5678', whatsapp: '+44 20 1234 5678' },
    eu: { sms: '+49 30 12345678', whatsapp: '+49 30 12345678' },
    au: { sms: '+61 2 1234 5678', whatsapp: '+61 2 1234 5678' },
    global: { sms: '+1 (555) 123-4567', whatsapp: '+1 (555) 123-4567' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            CareOS
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            SMS-First Family Healthcare Coordination
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Zero friction signup. Text "HI" → Start using immediately.
          </p>
        </div>

        {/* Channel Toggle */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 flex gap-1 shadow-lg">
            <button
              onClick={() => setChannel('sms')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                channel === 'sms'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              📱 SMS
            </button>
            <button
              onClick={() => setChannel('whatsapp')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                channel === 'whatsapp'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              💬 WhatsApp
            </button>
          </div>
        </div>

        {/* Benefits */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Why {channel === 'sms' ? 'SMS' : 'WhatsApp'}?
            </h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              {channel === 'sms' ? (
                <>
                  <li>✅ Works on any phone, no app required</li>
                  <li>✅ Universal compatibility</li>
                  <li>✅ Instant delivery</li>
                  <li>✅ 180+ countries supported</li>
                </>
              ) : (
                <>
                  <li>✅ Send photos of prescriptions & symptoms</li>
                  <li>✅ Voice note transcription</li>
                  <li>✅ Document handling (PDFs)</li>
                  <li>✅ Read receipts & quick replies</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Region Selector */}
        <div className="max-w-md mx-auto mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Region
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="us">🇺🇸 United States</option>
            <option value="uk">🇬🇧 United Kingdom</option>
            <option value="eu">🇪🇺 Europe</option>
            <option value="au">🇦🇺 Australia</option>
            <option value="global">🌍 Global</option>
          </select>
        </div>

        {/* Phone Number Display */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Text this number:
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {phoneNumbers[region]?.[channel] || phoneNumbers.us.sms}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Start with: <span className="font-mono font-semibold">&quot;HI&quot;</span>
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-4 mb-8">
          <a
            href={`${channel === 'sms' ? 'sms' : 'whatsapp'}:${phoneNumbers[region]?.[channel]?.replace(/\s/g, '') || phoneNumbers.us.sms?.replace(/\s/g, '')}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors shadow-lg"
          >
            {channel === 'sms' ? '📱 Open Messages' : '💬 Open WhatsApp'}
          </a>
          <Link
            href="/demo"
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
          >
            🎮 Try Demo
          </Link>
        </div>
        <div className="max-w-md mx-auto mb-8 flex gap-4 justify-center">
          <Link
            href="/sms-dashboard"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Dashboard →
          </Link>
          <span className="text-gray-400">|</span>
          <Link
            href="/admin/leads"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Business Portal →
          </Link>
        </div>

        {/* Country Support */}
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Available in 180+ countries
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-2xl">
            🇺🇸 🇬🇧 🇨🇦 🇦🇺 🇩🇪 🇫🇷 🇪🇸 🇮🇹 🇯🇵 🇰🇷 🇨🇳 🇮🇳 🇧🇷 🇲🇽 🇿🇦
          </div>
        </div>
      </div>
    </div>
  );
}
