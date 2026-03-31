import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const canEdit = (role) => ['wife', 'husband', 'admin'].includes(role);

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [creating, setCreating] = useState(false);

  const fetchCycles = async () => {
    try {
      const res = await api.get('/cycles');
      setCycles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCycles(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/cycles', { start_date: newDate });
      navigate(`/cycles/${res.data.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, cycleNumber) => {
    if (!window.confirm(`Delete Cycle ${cycleNumber}? All observations will be lost.`)) return;
    await api.delete(`/cycles/${id}`);
    fetchCycles();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cycles</h1>
          <p className="text-gray-500 text-sm mt-1">Track and view fertility charts by cycle.</p>
        </div>
        {canEdit(user?.role) && !showNewForm && (
          <button className="btn-primary" onClick={() => setShowNewForm(true)}>
            + New Cycle
          </button>
        )}
      </div>

      {showNewForm && (
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">Start a New Cycle</h2>
          <form onSubmit={handleCreate} className="flex items-end gap-4">
            <div>
              <label className="label">Start Date (Day 1 of cycle)</label>
              <input
                type="date"
                className="input w-auto"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Cycle'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowNewForm(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Loading cycles...</p>
      ) : cycles.length === 0 ? (
        <div className="card text-center py-16">
          <span className="text-4xl">🌸</span>
          <p className="text-gray-500 mt-3">No cycles yet.</p>
          {canEdit(user?.role) && (
            <button className="btn-primary mt-4" onClick={() => setShowNewForm(true)}>
              Start First Cycle
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cycles.map((cycle) => (
            <div
              key={cycle.id}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/cycles/${cycle.id}`)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">Cycle {cycle.cycle_number}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Started: {new Date(cycle.start_date).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
                    })}
                  </p>
                  {cycle.owner_name && (
                    <p className="text-xs text-gray-400 mt-0.5">By {cycle.owner_name}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium">
                    View Chart →
                  </span>
                  {canEdit(user?.role) && (
                    <button
                      className="text-xs text-red-400 hover:text-red-600 mt-1"
                      onClick={(e) => { e.stopPropagation(); handleDelete(cycle.id, cycle.cycle_number); }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              {cycle.notes && (
                <p className="text-xs text-gray-400 mt-3 truncate">{cycle.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
