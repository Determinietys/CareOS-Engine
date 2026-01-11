'use client';

/**
 * Shared Profile View Page
 * Displays a shared CareOS profile with notes and files
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Upload, Plus, Download, Calendar, User, Building2, Lock } from 'lucide-react';
import Image from 'next/image';

interface SharedProfile {
  share: {
    id: string;
    shareType: string;
    title?: string;
    description?: string;
    allowNotes: boolean;
    allowFiles: boolean;
    allowViewOnly: boolean;
    owner: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
    };
    hasAccess: boolean;
    access: {
      id: string;
      role: string;
      organization?: string;
      canAddNotes: boolean;
      canUploadFiles: boolean;
    } | null;
  };
  profile: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
    capturedItems: Array<{
      id: string;
      category: string;
      title: string;
      details?: string;
      person?: string;
      urgency: string;
      createdAt: string;
    }>;
    messages: Array<{
      id: string;
      body: string;
      createdAt: string;
    }>;
  };
  notes: Array<{
    id: string;
    title: string;
    content: string;
    category?: string;
    tags: string[];
    isPrivate: boolean;
    createdAt: string;
    access: {
      name?: string;
      email?: string;
      role: string;
      organization?: string;
    };
  }>;
  files: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    description?: string;
    category?: string;
    tags: string[];
    isPrivate: boolean;
    uploadedAt: string;
    access: {
      name?: string;
      email?: string;
      role: string;
      organization?: string;
    };
  }>;
}

export default function SharedProfilePage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<SharedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showFileForm, setShowFileForm] = useState(false);
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    isPrivate: false,
  });

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/profile/${token}`);
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!data?.share.access) return;

    try {
      const response = await fetch(`/api/profile/${token}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...noteForm,
          tags: noteForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) throw new Error('Failed to add note');

      await fetchProfile();
      setShowNoteForm(false);
      setNoteForm({ title: '', content: '', category: '', tags: '', isPrivate: false });
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note');
    }
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!data?.share.access || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', '');
    formData.append('category', '');
    formData.append('tags', '');
    formData.append('isPrivate', 'false');

    try {
      const response = await fetch(`/api/profile/${token}/files`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload file');

      await fetchProfile();
      setShowFileForm(false);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-gray-600">This profile share link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const { share, profile, notes, files } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {profile.image ? (
              <Image
                src={profile.image}
                alt={profile.name || 'Profile'}
                width={64}
                height={64}
                className="rounded-full"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{profile.name || 'CareOS Profile'}</h1>
              {share.title && <p className="text-gray-600 dark:text-gray-400">{share.title}</p>}
            </div>
          </div>

          {share.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">{share.description}</p>
          )}

          {share.access && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {share.access.role === 'medical_professional' ? (
                <Building2 size={16} />
              ) : (
                <User size={16} />
              )}
              <span>
                Access as: {share.access.role}
                {share.access.organization && ` from ${share.access.organization}`}
              </span>
            </div>
          )}
        </div>

        {/* Actions for Medical Teams */}
        {share.access && (share.access.canAddNotes || share.access.canUploadFiles) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
            <div className="flex gap-2">
              {share.access.canAddNotes && (
                <button
                  onClick={() => setShowNoteForm(!showNoteForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Add Note
                </button>
              )}
              {share.access.canUploadFiles && (
                <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                  <Upload size={16} />
                  Upload File
                  <input
                    type="file"
                    onChange={uploadFile}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx"
                  />
                </label>
              )}
            </div>

            {/* Note Form */}
            {showNoteForm && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-3">Add Note</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Note title"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500"
                  />
                  <textarea
                    placeholder="Note content"
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Category (optional)"
                      value={noteForm.category}
                      onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500"
                    />
                    <input
                      type="text"
                      placeholder="Tags (comma-separated)"
                      value={noteForm.tags}
                      onChange={(e) => setNoteForm({ ...noteForm, tags: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500"
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={noteForm.isPrivate}
                      onChange={(e) => setNoteForm({ ...noteForm, isPrivate: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Private (only visible to medical team)</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={addNote}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save Note
                    </button>
                    <button
                      onClick={() => {
                        setShowNoteForm(false);
                        setNoteForm({ title: '', content: '', category: '', tags: '', isPrivate: false });
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Captured Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Health Timeline</h2>
          {profile.capturedItems.length === 0 ? (
            <p className="text-gray-500">No items captured yet</p>
          ) : (
            <div className="space-y-3">
              {profile.capturedItems.map((item) => (
                <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      {item.details && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.details}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      item.urgency === 'high' ? 'bg-red-100 text-red-800' :
                      item.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.urgency}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {share.allowNotes && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText size={20} />
              Medical Notes
            </h2>
            {notes.length === 0 ? (
              <p className="text-gray-500">No notes yet</p>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{note.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          By {note.access.name || note.access.email || 'Unknown'} • {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {note.isPrivate && (
                        <Lock size={16} className="text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{note.content}</p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Files */}
        {share.allowFiles && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload size={20} />
              Medical Files
            </h2>
            {files.length === 0 ? (
              <p className="text-gray-500">No files uploaded yet</p>
            ) : (
              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText size={24} className="text-blue-600" />
                      <div>
                        <h3 className="font-medium">{file.fileName}</h3>
                        <p className="text-xs text-gray-500">
                          Uploaded by {file.access.name || file.access.email || 'Unknown'} • {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={file.fileUrl}
                      download
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <Download size={20} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

