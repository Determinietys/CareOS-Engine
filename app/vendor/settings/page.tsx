'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MapPin, Globe, DollarSign, Save } from 'lucide-react';
import Link from 'next/link';

interface VendorSettings {
  id: string;
  businessName: string;
  category: string;
  country?: string | null;
  countryName?: string | null;
  region?: string | null;
  city?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  currency?: string | null;
  serviceRadius?: number | null;
  serviceCountries: string[];
  minBudget?: number | null;
  maxBudget?: number | null;
}

export default function VendorSettingsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<VendorSettings | null>(null);
  const [newServiceCountry, setNewServiceCountry] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/vendor/profile');
      const data = await response.json();
      if (data.success) {
        setSettings(data.vendor);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/vendor/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (data.success) {
        alert('Settings saved successfully!');
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addServiceCountry = () => {
    if (newServiceCountry.trim() && settings) {
      setSettings({
        ...settings,
        serviceCountries: [...settings.serviceCountries, newServiceCountry.trim().toUpperCase()],
      });
      setNewServiceCountry('');
    }
  };

  const removeServiceCountry = (country: string) => {
    if (settings) {
      setSettings({
        ...settings,
        serviceCountries: settings.serviceCountries.filter((c) => c !== country),
      });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
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

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/vendor/dashboard"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Vendor Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your location and service area to receive relevant leads
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
          {/* Location Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="text-blue-600" size={24} />
              Your Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country Code (ISO)
                </label>
                <input
                  type="text"
                  value={settings.country || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, country: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., NG, US, GB"
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country Name
                </label>
                <input
                  type="text"
                  value={settings.countryName || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, countryName: e.target.value })
                  }
                  placeholder="e.g., Nigeria, United States"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Region/State
                </label>
                <input
                  type="text"
                  value={settings.region || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, region: e.target.value })
                  }
                  placeholder="e.g., Lagos State, California"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={settings.city || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, city: e.target.value })
                  }
                  placeholder="e.g., Lagos, New York"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={settings.address || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, address: e.target.value })
                  }
                  placeholder="Full address (optional)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={settings.latitude || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      latitude: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  placeholder="e.g., 6.5244"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={settings.longitude || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      longitude: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  placeholder="e.g., 3.3792"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Service Area Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe className="text-green-600" size={24} />
              Service Area
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service Radius (km)
                </label>
                <input
                  type="number"
                  value={settings.serviceRadius || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      serviceRadius: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Leave empty for global service"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave empty to serve globally. Set a number to limit service to a radius in kilometers.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service Countries
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newServiceCountry}
                    onChange={(e) => setNewServiceCountry(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addServiceCountry()}
                    placeholder="Add country code (e.g., NG, US)"
                    maxLength={2}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addServiceCountry}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.serviceCountries.map((country) => (
                    <span
                      key={country}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {country}
                      <button
                        onClick={() => removeServiceCountry(country)}
                        className="hover:text-blue-600 dark:hover:text-blue-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Countries you serve. Leave empty to serve all countries.
                </p>
              </div>
            </div>
          </div>

          {/* Budget Range Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="text-yellow-600" size={24} />
              Budget Range (USD)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Budget
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.minBudget || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      minBudget: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  placeholder="e.g., 10.00"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Budget
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.maxBudget || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxBudget: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  placeholder="e.g., 1000.00"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Only show leads within your budget range. Leave empty to see all budgets.
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

