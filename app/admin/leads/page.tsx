'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DollarSign, MapPin, Clock, CheckCircle2, XCircle, AlertCircle, Filter } from 'lucide-react';
import Link from 'next/link';

interface Lead {
  id: string;
  category: string;
  partnerName: string | null;
  needDescription: string;
  locationState: string | null;
  urgency: string | null;
  consentGiven: boolean;
  consentTimestamp: string | null;
  status: string;
  leadValue: number | null;
  createdAt: string;
  user?: {
    name: string | null;
    phone: string | null;
  } | null;
}

export default function AdminLeadsPage() {
  const { data: session, status } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'captured' | 'consented' | 'distributed' | 'declined'>('all');
  const [stats, setStats] = useState({
    total: 0,
    totalValue: 0,
    consented: 0,
    distributed: 0,
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLeads();
    }
  }, [status, filter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/leads?status=${filter}`);
      const data = await response.json();
      
      if (data.success) {
        setLeads(data.leads || []);
        setStats(data.stats || { total: 0, totalValue: 0, consented: 0, distributed: 0 });
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDistribute = async (leadId: string) => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/distribute`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        fetchLeads(); // Refresh
      }
    } catch (error) {
      console.error('Error distributing lead:', error);
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
            Lead Management Portal
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage partner referral leads
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <AlertCircle className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.totalValue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Consented</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.consented}</p>
              </div>
              <CheckCircle2 className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Distributed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.distributed}</p>
              </div>
              <CheckCircle2 className="text-green-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow flex items-center gap-4">
          <Filter className="text-gray-600 dark:text-gray-400" size={20} />
          <div className="flex gap-2">
            {(['all', 'captured', 'consented', 'distributed', 'declined'] as const).map((f) => (
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
        </div>

        {/* Leads Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              No leads found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Need Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {lead.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {lead.needDescription}
                        </div>
                        {lead.locationState && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <MapPin size={12} />
                            {lead.locationState}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {lead.partnerName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400">
                          <DollarSign size={16} />
                          {lead.leadValue?.toFixed(2) || '0.00'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            lead.status === 'distributed'
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : lead.status === 'consented'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : lead.status === 'declined'
                              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {lead.status === 'consented' && (
                          <button
                            onClick={() => handleDistribute(lead.id)}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Distribute
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

