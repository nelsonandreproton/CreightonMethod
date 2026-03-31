import { useState, useEffect } from 'react';
import api from '../api/client';

// Creighton stamp options
const STAMP_OPTIONS = [
  { color: 'red', symbol: 'H', label: 'Heavy Bleeding', description: 'Menstruation - Heavy' },
  { color: 'red', symbol: 'M', label: 'Moderate Bleeding', description: 'Menstruation - Moderate' },
  { color: 'red', symbol: 'L', label: 'Light Bleeding', description: 'Menstruation - Light' },
  { color: 'red', symbol: 'VL', label: 'Very Light Bleeding', description: 'Menstruation - Very Light' },
  { color: 'brown', symbol: 'B', label: 'Brown Discharge', description: 'Brown/dark discharge' },
  { color: 'green', symbol: '', label: 'Dry', description: 'No mucus observed' },
  { color: 'white_baby', symbol: '', label: 'Mucus (Fertile)', description: 'Mucus present — potentially fertile' },
  { color: 'green_baby', symbol: '', label: 'Post-Peak (1-3)', description: 'Post-peak days 1–3: green circle with baby' },
  { color: 'yellow', symbol: '', label: 'Yellow Stamp', description: 'Special / unusual discharge' },
];

const STAMP_COLOR_CLASSES = {
  red: 'bg-red-600 border-red-700 text-white',
  brown: 'bg-amber-800 border-amber-900 text-white',
  green: 'bg-green-600 border-green-700 text-white',
  white_baby: 'bg-white border-gray-400 text-gray-800',
  green_baby: 'bg-green-600 border-green-700 text-white',
  yellow: 'bg-yellow-400 border-yellow-500 text-gray-800',
};

const OBS_NUMBERS = ['0', '2', '4', '6', '8', '10'];
const OBS_LETTERS = ['', 'C', 'K', 'L', 'CK', 'KL', 'CKL', 'AD', 'B'];
const SENSATIONS = ['dry', 'smooth', 'damp', 'wet', 'lubricative'];

export default function DayEntryModal({ cycleId, dayNumber, obsDate, existing, onSave, onClose }) {
  const [form, setForm] = useState({
    stamp_color: existing?.stamp_color || 'green',
    stamp_symbol: existing?.stamp_symbol || '',
    observation_number: existing?.observation_number || '',
    observation_letters: existing?.observation_letters || '',
    sensation: existing?.sensation || '',
    is_peak_day: existing?.is_peak_day || false,
    is_menstruation: existing?.is_menstruation || false,
    notes: existing?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // When a stamp is selected, auto-fill symbol and menstruation flag
  const selectStamp = (opt) => {
    setForm((prev) => ({
      ...prev,
      stamp_color: opt.color,
      stamp_symbol: opt.symbol,
      is_menstruation: opt.color === 'red',
      observation_number: opt.color === 'red' || opt.color === 'brown' ? '' : prev.observation_number,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        cycle_id: cycleId,
        day_number: dayNumber,
        obs_date: obsDate,
        ...form,
      };
      const res = await api.post('/observations', payload);
      onSave(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const selectedStampClass = STAMP_COLOR_CLASSES[form.stamp_color] || 'bg-white border-gray-300';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Day {dayNumber}</h2>
              <p className="text-sm text-gray-500">{new Date(obsDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Stamp selector */}
            <div>
              <label className="label">Stamp Type</label>
              <div className="grid grid-cols-4 gap-2">
                {STAMP_OPTIONS.map((opt) => {
                  const isSelected = form.stamp_color === opt.color && form.stamp_symbol === opt.symbol;
                  return (
                    <button
                      key={`${opt.color}-${opt.symbol}`}
                      type="button"
                      title={opt.description}
                      onClick={() => selectStamp(opt)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all
                        ${isSelected ? 'border-rose-500 ring-2 ring-rose-300' : 'border-transparent hover:border-gray-200'}
                      `}
                    >
                      <div
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm
                          ${STAMP_COLOR_CLASSES[opt.color]}`}
                      >
                        {opt.color === 'white_baby' || opt.color === 'green_baby' ? '👶' : opt.symbol}
                      </div>
                      <span className="text-xs text-gray-600 text-center leading-tight">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Observation code — only relevant for non-menstruation days */}
            {!form.is_menstruation && form.stamp_color !== 'brown' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Observation Number</label>
                  <div className="flex flex-wrap gap-2">
                    {OBS_NUMBERS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm({ ...form, observation_number: n })}
                        className={`px-3 py-1 rounded-lg border text-sm font-mono font-medium transition-colors
                          ${form.observation_number === n
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'border-gray-300 text-gray-700 hover:border-rose-400'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Letters</label>
                  <div className="flex flex-wrap gap-2">
                    {OBS_LETTERS.map((l) => (
                      <button
                        key={l || 'none'}
                        type="button"
                        onClick={() => setForm({ ...form, observation_letters: l })}
                        className={`px-3 py-1 rounded-lg border text-sm font-mono font-medium transition-colors
                          ${form.observation_letters === l
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'border-gray-300 text-gray-700 hover:border-rose-400'}`}
                      >
                        {l || '—'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sensation */}
            {!form.is_menstruation && (
              <div>
                <label className="label">Sensation</label>
                <div className="flex flex-wrap gap-2">
                  {SENSATIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, sensation: form.sensation === s ? '' : s })}
                      className={`px-3 py-1.5 rounded-lg border text-sm capitalize transition-colors
                        ${form.sensation === s
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'border-gray-300 text-gray-700 hover:border-rose-400'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Peak day toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="peak_day"
                checked={form.is_peak_day}
                onChange={(e) => setForm({ ...form, is_peak_day: e.target.checked })}
                className="w-4 h-4 text-rose-600 rounded"
              />
              <label htmlFor="peak_day" className="text-sm font-medium text-gray-700 cursor-pointer">
                Peak Day <span className="text-gray-400 font-normal">(last day of most fertile mucus)</span>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                className="input resize-none"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional observations..."
              />
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm shadow-sm
                  ${selectedStampClass}`}
              >
                {form.stamp_color === 'white_baby' || form.stamp_color === 'green_baby' ? '👶' : form.stamp_symbol}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {form.observation_number}{form.observation_letters || ''}
                  {form.sensation ? ` · ${form.sensation}` : ''}
                  {form.is_peak_day ? ' · Peak Day (P)' : ''}
                </p>
                <p className="text-xs text-gray-400">Preview</p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save Observation'}
              </button>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
