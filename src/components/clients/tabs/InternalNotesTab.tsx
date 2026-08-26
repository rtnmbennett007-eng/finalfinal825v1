import React, { useState } from 'react';
import { MessageSquare, Plus, Pin, Clock, User, AlertCircle, Save, Tag } from 'lucide-react';
import { Client, ClientInternalNote } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';

interface InternalNotesTabProps {
  client: Client;
  notes: ClientInternalNote[];
  onRefresh: () => void;
}

export const InternalNotesTab: React.FC<InternalNotesTabProps> = ({
  client,
  notes = [],
  onRefresh,
}) => {
  const { createClientInternalNote, addToast } = useData();
  const { currentUser } = useAuth();

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'General' | 'Underwriting' | 'Verification' | 'Closing' | 'Urgent'>('General');
  const [isPinned, setIsPinned] = useState(false);

  const safeNotes = Array.isArray(notes) ? notes : [];
  const sortedNotes = [...safeNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      addToast('error', 'Validation Error', 'Note content cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      await createClientInternalNote(client.id, {
        clientId: client.id,
        content: content.trim(),
        category,
        isPinned,
        author: currentUser?.name || 'Staff Member',
        createdAt: new Date().toISOString(),
      });
      addToast('success', 'Note Logged', 'Internal staff note recorded to file.');
      setContent('');
      setIsAddingNote(false);
      setIsPinned(false);
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save internal note.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
              Internal Team Log
            </span>
            <span className="text-xs text-slate-400">Total Notes: {safeNotes.length}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            Internal Staff Notes & Operational Memoranda
          </h2>
          <p className="text-xs text-slate-400">
            Secure, timestamped internal notes visible only to Maple X financial staff and underwriters.
          </p>
        </div>

        {!isAddingNote && (
          <button
            onClick={() => setIsAddingNote(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Internal Note</span>
          </button>
        )}
      </div>

      {/* Add Note Form */}
      {isAddingNote && (
        <form
          onSubmit={handleSaveNote}
          className="bg-[#0b1528] border border-amber-500/40 p-5 rounded-2xl shadow-xl space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" /> Log New Internal Memorandum
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingNote(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none"
              >
                <option value="General">General Note</option>
                <option value="Underwriting">Underwriting & Risk</option>
                <option value="Verification">Verification & Identity</option>
                <option value="Closing">Closing & Stips</option>
                <option value="Urgent">Urgent / Action Required</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-blue-800 text-amber-500 focus:ring-amber-400"
                />
                <span className="flex items-center gap-1 font-semibold text-amber-300">
                  <Pin className="w-3.5 h-3.5" /> Pin to Top of Client Record
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Note Content *</label>
            <textarea
              rows={3}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter comprehensive memorandum details, underwriter observations, or client interaction notes..."
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingNote(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Note to Master File'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      {sortedNotes.length === 0 ? (
        <div className="bg-[#0b1528] border border-blue-900/60 p-12 rounded-2xl text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Internal Notes Recorded Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Log internal team observations, underwriting insights, or important borrower updates.
          </p>
          <button
            onClick={() => setIsAddingNote(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Internal Note</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedNotes.map((note) => (
            <div
              key={note.id}
              className={`p-4 rounded-2xl border transition-all ${
                note.isPinned
                  ? 'bg-gradient-to-r from-[#0d1e3d] to-[#0b1528] border-amber-500/50 shadow-md shadow-amber-500/5'
                  : 'bg-[#0b1528] border-blue-900/60 hover:border-blue-700/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  {note.isPinned && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono">
                      <Pin className="w-3 h-3" /> PINNED
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold uppercase">
                    {note.category || 'General'}
                  </span>
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-400" />
                    {note.author || 'Staff'}
                  </span>
                </div>

                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {note.createdAt ? note.createdAt.replace('T', ' ').slice(0, 16) : 'Logged'}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
