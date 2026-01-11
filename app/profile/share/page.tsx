'use client';

/**
 * Profile Sharing Management Page
 * Users can create share links and manage access
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Share2, Copy, Check, Plus, X, Mail, User, Building2, Calendar } from 'lucide-react';
import Link from 'next/link';

interface ProfileShare {
  id: string;
  shareToken: string;
  shareLink: string;
  shareType: string;
  title?: string;
  description?: string;
  expiresAt?: string;
  allowNotes: boolean;
  allowFiles: boolean;
  allowViewOnly: boolean;
  createdAt: string;
}

interface ProfileAccess {
  id: string;
  userId?: string;
  email?: string;
  name?: string;
  role: string;
  organization?: string;
  invitedAt: string;
  acceptedAt?: string;
  lastAccessedAt?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
}

export default function ProfileSharePage() {
  const { data: session } = useSession();
  const [shares, setShares] = useState<ProfileShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedShare, setSelectedShare] = useState<string | null>(null);
  const [accesses, setAccesses] = useState<Record<string, ProfileAccess[]>>({});

  // Form state
  const [formData, setFormData] = useState({
    shareType: 'family' as 'family' | 'friend' | 'medical_team' | 'public',
    title: '',
    description: '',
    expiresAt: '',
    allowNotes: false,
    allowFiles: false,
    allowViewOnly: true,
  });

  useEffect(() => {
    if (session) {
      fetchShares();
    }
  }, [session]);

  const fetchShares = async () => {
    try {
      const response = await fetch('/api/profile/shares');
      if (!response.ok) throw new Error('Failed to fetch shares');
      const data = await response.json();
      setShares(data.shares);
    } catch (error) {
      console.error('Failed to fetch shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const createShare = async () => {
    try {
      const response = await fetch('/api/profile/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expiresAt: formData.expiresAt || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create share');
      }

      const data = await response.json();
      setShares([...shares, data.share]);
      setShowCreateForm(false);
      setFormData({
        shareType: 'family',
        title: '',
        description: '',
        expiresAt: '',
        allowNotes: false,
        allowFiles: false,
        allowViewOnly: true,
      });
    } catch (error) {
      console.error('Failed to create share:', error);
      alert('Failed to create share link');
    }
  };

  const copyToClipboard = async (text: string, token: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const fetchAccesses = async (shareId: string) => {
    if (accesses[shareId]) return;

    try {
      const share = shares.find(s => s.id === shareId);
      if (!share) return;

      const response = await fetch(`/api/profile/${share.shareToken}/access`);
      if (!response.ok) throw new Error('Failed to fetch accesses');

      const data = await response.json();
      setAccesses({ ...accesses, [shareId]: data.accesses });
    } catch (error) {
      console.error('Failed to fetch accesses:', error);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            Sign in to manage profile shares
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Share Your Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create share links to give family, friends, and medical teams access to your CareOS profile
          </p>
        </div>

        {/* Create Share Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Create New Share Link
          </button>
        </div>

        {/* Create Share Form */}
        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create Share Link</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Share Type</label>
                <select
                  value={formData.shareType}
                  onChange={(e) => setFormData({ ...formData, shareType: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="family">Family</option>
                  <option value="friend">Friend</option>
                  <option value="medical_team">Medical Team</option>
                  <option value="public">Public</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title (optional)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Share with Dr. Smith"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expires At (optional)</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allowNotes}
                    onChange={(e) => setFormData({ ...formData, allowNotes: e.target.checked })}
                    className="rounded"
                  />
                  <span>Allow medical teams to log notes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allowFiles}
                    onChange={(e) => setFormData({ ...formData, allowFiles: e.target.checked })}
                    className="rounded"
                  />
                  <span>Allow medical teams to upload files</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allowViewOnly}
                    onChange={(e) => setFormData({ ...formData, allowViewOnly: e.target.checked })}
                    className="rounded"
                  />
                  <span>View-only access (family/friends)</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={createShare}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Share Link
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shares List */}
        {shares.length === 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <Share2 size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              No share links created yet. Create one to get started.
            </p>
          </div>
        )}

        {shares.map((share) => (
          <div key={share.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {share.title || `${share.shareType} share`}
                </h3>
                {share.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {share.description}
                  </p>
                )}
              </div>
              <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                {share.shareType}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Share2 size={16} className="text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Share Link:</span>
                <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  {share.shareLink}
                </code>
                <button
                  onClick={() => copyToClipboard(share.shareLink, share.id)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  {copiedToken === share.id ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <Copy size={16} className="text-gray-600" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                {share.allowNotes && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded">Notes Allowed</span>
                )}
                {share.allowFiles && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded">Files Allowed</span>
                )}
                {share.allowViewOnly && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded">View Only</span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedShare(selectedShare === share.id ? null : share.id);
                  if (selectedShare !== share.id) {
                    fetchAccesses(share.id);
                  }
                }}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                {selectedShare === share.id ? 'Hide' : 'Show'} Access List
              </button>
              <Link
                href={`/profile/${share.shareToken}`}
                className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
              >
                View Profile
              </Link>
            </div>

            {/* Access List */}
            {selectedShare === share.id && accesses[share.id] && (
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <h4 className="font-semibold mb-2">People with Access</h4>
                {accesses[share.id].length === 0 ? (
                  <p className="text-sm text-gray-500">No one has been granted access yet</p>
                ) : (
                  <div className="space-y-2">
                    {accesses[share.id].map((access) => (
                      <div key={access.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="flex items-center gap-2">
                          {access.role === 'medical_professional' ? (
                            <Building2 size={16} className="text-blue-600" />
                          ) : (
                            <User size={16} className="text-gray-600" />
                          )}
                          <span className="text-sm">
                            {access.name || access.user?.name || access.email || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-500">({access.role})</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {access.lastAccessedAt ? (
                            <span>Last accessed: {new Date(access.lastAccessedAt).toLocaleDateString()}</span>
                          ) : (
                            <span className="text-yellow-600">Not accessed yet</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

