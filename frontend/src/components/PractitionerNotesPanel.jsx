import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function PractitionerNotesPanel({ cycleId, notes, onNoteAdded }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const canAddNote = user?.role === 'practitioner' || user?.role === 'admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await api.post(`/observations/cycle/${cycleId}/notes`, { note: text.trim() });
      onNoteAdded(res.data);
      setText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span>📋</span> Practitioner Notes
      </h2>

      {notes.length === 0 ? (
        <p className="text-sm text-gray-400">No practitioner notes yet.</p>
      ) : (
        <div className="space-y-3 mb-4">
          {notes.map((n) => (
            <div key={n.id} className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-sm text-gray-700">{n.note}</p>
              <p className="text-xs text-gray-400 mt-1.5">
                {n.practitioner_name} · {new Date(n.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
                {n.day_number && ` · Day ${n.day_number}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {canAddNote && (
        <form onSubmit={handleSubmit} className="mt-4">
          <label className="label">Add a Note</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your observation or instruction..."
          />
          <button type="submit" className="btn-primary mt-2" disabled={saving || !text.trim()}>
            {saving ? 'Saving...' : 'Add Note'}
          </button>
        </form>
      )}
    </div>
  );
}
