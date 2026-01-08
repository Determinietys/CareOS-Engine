'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DollarSign, Calendar, CheckCircle2, XCircle, Filter, Clock, MapPin, Search } from 'lucide-react';
import Link from 'next/link';

interface Lead {
  id: string;
  category: string;
  needDescription: string;
  locationState: string | null;
  urgency: string | null;
  status: string;
  leadValue: number | null;
  createdAt: string;
  user?: {
    name: string | null;
    phone: string | null;
  } | null;
}

interface Vendor {
  id: string;
  businessName: string;
  category: string;
  subscriptionTier: string;
  verified: boolean;
  totalLeads: number;
  acceptedLeads: number;
}

export default function VendorDashboard() {
  const { data: session, status } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'accepted'>('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchVendorData();
    }
  }, [status, filter]);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      const [vendorRes, leadsRes] = await Promise.all([
        fetch('/api/vendor/profile'),
        fetch(`/api/vendor/leads?status=${filter}&q=${encodeURIComponent(searchQuery)}`),
      ]);

      const vendorData = await vendorRes.json();
      const leadsData = await leadsRes.json();

      if (vendorData.success) {
        setVendor(vendorData.vendor);
      }

      if (leadsData.success) {
        setLeads(leadsData.leads || []);
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptLead = async () => {
    if (!selectedLead || !meetingDate || !meetingTime) return;

    try {
      const response = await fetch(`/api/vendor/leads/${selectedLead.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingDate,
          meetingTime,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowAcceptModal(false);
        setSelectedLead(null);
        fetchVendorData(); // Refresh
        alert('Lead accepted! Calendar invites sent to both parties.');
      } else {
        alert(data.error || 'Failed to accept lead');
      }
    } catch (error) {
      console.error('Error accepting lead:', error);
      alert('Failed to accept lead');
    }
  };

  if (status === 'loading') {
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

  // Subscription tier limits
  const tierLimits: Record<string, { maxLeads: number; canAccept: boolean }> = {
    free: { maxLeads: 5, canAccept: false },
    basic: { maxLeads: 20, canAccept: true },
    premium: { maxLeads: 100, canAccept: true },
    enterprise: { maxLeads: -1, canAccept: true }, // unlimited
  };

  const limits = vendor ? tierLimits[vendor.subscriptionTier] || tierLimits.free : tierLimits.free;
  const canAcceptMore = limits.maxLeads === -1 || (vendor?.acceptedLeads || 0) < limits.maxLeads;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Vendor Dashboard
          </h1>
          {vendor && (
            <div className="flex items-center gap-4">
              <p className="text-gray-600 dark:text-gray-400">
                {vendor.businessName} • {vendor.category}
              </p>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  vendor.subscriptionTier === 'enterprise'
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                    : vendor.subscriptionTier === 'premium'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : vendor.subscriptionTier === 'basic'
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                {vendor.subscriptionTier.toUpperCase()} Tier
              </span>
              {vendor.verified && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  ✓ Verified
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        {vendor && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Leads Viewed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {vendor.totalLeads}
                  </p>
                </div>
                <DollarSign className="text-blue-600" size={32} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Accepted Leads</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {vendor.acceptedLeads} / {limits.maxLeads === -1 ? '∞' : limits.maxLeads}
                  </p>
                </div>
                <CheckCircle2 className="text-green-600" size={32} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available Now</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {leads.length}
                  </p>
                </div>
                <Clock className="text-yellow-600" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow flex flex-col sm:flex-row gap-4 items-center">
          <Filter className="text-gray-600 dark:text-gray-400" size={20} />
          <div className="flex gap-2 flex-1">
            {(['all', 'available', 'accepted'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchVendorData();
                }}
                placeholder="Search leads..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Leads List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              No leads found. {!limits.canAccept && 'Upgrade your subscription to accept leads.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {lead.category.replace('_', ' ')}
                        </span>
                        {lead.leadValue && (
                          <div className="flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400">
                            <DollarSign size={16} />
                            {lead.leadValue.toFixed(2)}
                          </div>
                        )}
                        {lead.urgency && (
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              lead.urgency === 'high'
                                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                : lead.urgency === 'medium'
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {lead.urgency}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {lead.needDescription}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {lead.locationState && (
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            {lead.locationState}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="ml-6 flex flex-col gap-2">
                      {lead.status === 'consented' && limits.canAccept && canAcceptMore && (
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowAcceptModal(true);
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Accept Lead
                        </button>
                      )}
                      {lead.status === 'accepted' && (
                        <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-center">
                          Accepted
                        </span>
                      )}
                      {(!limits.canAccept || !canAcceptMore) && (
                        <Link
                          href="/settings/billing"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-center"
                        >
                          Upgrade
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accept Lead Modal */}
      {showAcceptModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Accept Lead
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Schedule a meeting with the lead. Calendar invites will be sent to both parties.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meeting Date
                </label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meeting Time
                </label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAcceptModal(false);
                  setSelectedLead(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptLead}
                disabled={!meetingDate || !meetingTime}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Accept & Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

