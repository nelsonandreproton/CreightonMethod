import { useState, useEffect } from 'react';
import api from '../api/client';

const ROLES = ['wife', 'husband', 'practitioner', 'admin'];
const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  wife: 'bg-pink-100 text-pink-700',
  husband: 'bg-blue-100 text-blue-700',
  practitioner: 'bg-green-100 text-green-700',
};

function UserForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { name: '', email: '', password: '', role: 'wife' }
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required={!isEdit}
            disabled={isEdit}
          />
        </div>
        <div>
          <label className="label">{isEdit ? 'New Password (leave blank to keep)' : 'Password'}</label>
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!isEdit}
            minLength={6}
          />
        </div>
        <div>
          <label className="label">Role</label>
          <select
            className="input"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (form) => {
    await api.post('/users', form);
    setShowForm(false);
    fetchUsers();
  };

  const handleUpdate = async (form) => {
    const payload = { name: form.name, role: form.role };
    if (form.password) payload.password = form.password;
    await api.put(`/users/${editUser.id}`, payload);
    setEditUser(null);
    fetchUsers();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This will also delete all their cycles.`)) return;
    await api.delete(`/users/${id}`);
    fetchUsers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage accounts for wife, husband, and practitioner.</p>
        </div>
        {!showForm && !editUser && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + New User
          </button>
        )}
      </div>

      {(showForm || editUser) && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">{editUser ? 'Edit User' : 'Create New User'}</h2>
          <UserForm
            initial={editUser ? { name: editUser.name, email: editUser.email, password: '', role: editUser.role } : null}
            onSave={editUser ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditUser(null); }}
          />
        </div>
      )}

      <div className="card">
        {loading ? (
          <p className="text-gray-400">Loading users...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Created</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium">{u.name}</td>
                  <td className="py-3 text-gray-600">{u.email}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${ROLE_COLORS[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => { setEditUser(u); setShowForm(false); }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs text-red-500 hover:underline"
                        onClick={() => handleDelete(u.id, u.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">No users yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
