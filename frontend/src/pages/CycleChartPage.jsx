import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import CreightonStamp from '../components/CreightonStamp';
import DayEntryModal from '../components/DayEntryModal';
import PractitionerNotesPanel from '../components/PractitionerNotesPanel';

const canEdit = (role) => ['wife', 'husband', 'admin'].includes(role);

// How many days to show in the chart
const DAYS_PER_CYCLE = 35;

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CycleChartPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cycle, setCycle] = useState(null);
  const [observations, setObservations] = useState([]);
  const [practitionerNotes, setPractitionerNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalDay, setModalDay] = useState(null); // { dayNumber, obsDate, existing }

  const fetchCycle = async () => {
    try {
      const res = await api.get(`/cycles/${id}`);
      setCycle(res.data.cycle);
      setObservations(res.data.observations);
      setPractitionerNotes(res.data.practitionerNotes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCycle(); }, [id]);

  // Map observations by day_number for O(1) lookup
  const obsByDay = {};
  observations.forEach((o) => { obsByDay[o.day_number] = o; });

  const handleDayClick = (dayNumber) => {
    if (!canEdit(user?.role)) return;
    const obsDate = addDays(cycle.start_date, dayNumber - 1);
    const existing = obsByDay[dayNumber] || null;
    setModalDay({ dayNumber, obsDate, existing });
  };

  const handleSave = (saved) => {
    setObservations((prev) => {
      const idx = prev.findIndex((o) => o.id === saved.id || o.day_number === saved.day_number);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved].sort((a, b) => a.day_number - b.day_number);
    });
    setModalDay(null);
  };

  // Build rows of 7 days for the chart (5 rows of 7)
  const rows = [];
  for (let row = 0; row < 5; row++) {
    const days = [];
    for (let col = 0; col < 7; col++) {
      const dayNumber = row * 7 + col + 1;
      days.push(dayNumber);
    }
    rows.push(days);
  }

  if (loading) return <div className="text-gray-400">Loading cycle...</div>;
  if (!cycle) return <div className="text-red-500">Cycle not found.</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600">
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cycle {cycle.cycle_number}</h1>
          <p className="text-gray-500 text-sm">
            Started {new Date(cycle.start_date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
            })}
            {cycle.owner_name && ` · ${cycle.owner_name}`}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="card mb-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Fertility Map</h2>
          {canEdit(user?.role) && (
            <p className="text-xs text-gray-400">Click any day to enter an observation</p>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-5 text-xs text-gray-600">
          {[
            { color: 'bg-red-600', label: 'Menstruation' },
            { color: 'bg-amber-800', label: 'Brown/Spotting' },
            { color: 'bg-green-600', label: 'Dry' },
            { color: 'bg-white border border-gray-300', label: 'Fertile (Mucus)' },
            { color: 'bg-green-600', label: 'Post-Peak 1–3 👶' },
            { color: 'bg-yellow-400', label: 'Special' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded-full ${item.color}`} />
              <span>{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-rose-600">P</span>
            <span>= Peak Day</span>
          </div>
        </div>

        {/* Chart grid */}
        <div className="space-y-1 min-w-[560px]">
          {rows.map((rowDays, rowIdx) => (
            <div key={rowIdx} className="flex gap-1">
              {rowDays.map((dayNumber) => {
                const obs = obsByDay[dayNumber];
                const obsDate = addDays(cycle.start_date, dayNumber - 1);
                const dayOfWeek = new Date(obsDate + 'T12:00:00').getDay();
                const isSunday = dayOfWeek === 0;
                const isClickable = canEdit(user?.role);

                return (
                  <div
                    key={dayNumber}
                    onClick={() => handleDayClick(dayNumber)}
                    className={`
                      flex-1 min-w-[70px] flex flex-col items-center gap-1 py-2 px-1 rounded-lg
                      border transition-all
                      ${isClickable ? 'cursor-pointer hover:bg-rose-50 hover:border-rose-200' : 'cursor-default'}
                      ${isSunday ? 'bg-gray-50 border-gray-200' : 'border-gray-100'}
                      ${obs ? '' : 'opacity-70'}
                    `}
                  >
                    {/* Day number */}
                    <div className="text-center">
                      <span className="text-xs font-bold text-gray-500">{dayNumber}</span>
                      <div className="text-xs text-gray-300">{DAY_ABBR[dayOfWeek]}</div>
                    </div>

                    {/* Stamp */}
                    <CreightonStamp observation={obs} size="md" />

                    {/* Sensation */}
                    {obs?.sensation && (
                      <span className="text-xs text-gray-400 capitalize truncate max-w-full px-1 text-center">
                        {obs.sensation.slice(0, 3)}
                      </span>
                    )}

                    {/* Date */}
                    <span className="text-xs text-gray-300 hidden sm:block">
                      {new Date(obsDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Cycle notes */}
        {cycle.notes && (
          <p className="mt-4 text-sm text-gray-500 border-t border-gray-100 pt-4">{cycle.notes}</p>
        )}
      </div>

      {/* Observations list (compact) */}
      {observations.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-700 mb-3">Recorded Observations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100 text-xs uppercase tracking-wide">
                  <th className="pb-2 pr-4">Day</th>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Stamp</th>
                  <th className="pb-2 pr-4">Code</th>
                  <th className="pb-2 pr-4">Sensation</th>
                  <th className="pb-2 pr-4">Peak</th>
                  <th className="pb-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {observations.map((obs) => (
                  <tr
                    key={obs.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 ${canEdit(user?.role) ? 'cursor-pointer' : ''}`}
                    onClick={() => canEdit(user?.role) && handleDayClick(obs.day_number)}
                  >
                    <td className="py-2 pr-4 font-medium">{obs.day_number}</td>
                    <td className="py-2 pr-4 text-gray-500">
                      {new Date(obs.obs_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2 pr-4">
                      <CreightonStamp observation={obs} size="sm" />
                    </td>
                    <td className="py-2 pr-4 font-mono text-gray-700">
                      {obs.observation_number}{obs.observation_letters || ''}
                    </td>
                    <td className="py-2 pr-4 text-gray-500 capitalize">{obs.sensation || '—'}</td>
                    <td className="py-2 pr-4">
                      {obs.is_peak_day && <span className="text-rose-600 font-bold">P</span>}
                    </td>
                    <td className="py-2 text-gray-400 truncate max-w-[160px]">{obs.notes || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Practitioner Notes */}
      <PractitionerNotesPanel
        cycleId={cycle.id}
        notes={practitionerNotes}
        onNoteAdded={(note) => setPractitionerNotes((prev) => [...prev, note])}
      />

      {/* Day Entry Modal */}
      {modalDay && (
        <DayEntryModal
          cycleId={cycle.id}
          dayNumber={modalDay.dayNumber}
          obsDate={modalDay.obsDate}
          existing={modalDay.existing}
          onSave={handleSave}
          onClose={() => setModalDay(null)}
        />
      )}
    </div>
  );
}
