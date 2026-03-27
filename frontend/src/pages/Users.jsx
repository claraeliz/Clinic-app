import { useEffect, useState } from 'react'
import { Trash2, Plus, X } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const ROLE_STYLES = {
  ADMIN:      'bg-amber-100 text-amber-700',
  FRONT_DESK: 'bg-blue-100 text-blue-700',
  MEDIC:      'bg-violet-100 text-violet-700',
}

const ROLE_LABELS = {
  ADMIN:      'Administrator',
  FRONT_DESK: 'Recepție',
  MEDIC:      'Medic',
}

export default function Users() {
  const { user: me } = useAuth()
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'MEDIC' })

  useEffect(() => {
    api.get('/auth/users')
      .then(r => setUsers(r.data))
      .catch(err => setError(err.response?.data?.message ?? err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.post('/auth/users', form)
      setUsers(prev => [...prev, res.data])
      setShowForm(false)
      setForm({ name: '', email: '', password: '', role: 'MEDIC' })
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Elimini acest utilizator din laborator?')) return
    try {
      await api.delete(`/auth/users/${id}`)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
    }
  }

  const initials = n => n.split(' ').map(w => w[0]).filter(Boolean).slice(0,2).join('').toUpperCase()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Echipă</h1>
          <p className="text-slate-400 text-sm mt-0.5">Gestionează utilizatorii laboratorului</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus size={16} /> Adaugă utilizator
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Add user form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Membru nou în echipă</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nume complet *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Email *</label>
              <input required type="email" autoComplete="new-password" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Parolă *</label>
              <input required type="password" autoComplete="new-password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Rol *</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="MEDIC">Medic</option>
                <option value="FRONT_DESK">Recepție</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">Anulează</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-60">
                {saving ? 'Se creează…' : 'Creează utilizator'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-slate-100">
        {loading ? (
          <p className="p-6 text-slate-400 text-sm">Se încarcă…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Nume</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium">Înregistrat la</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {initials(u.name)}
                      </div>
                      <span className="font-medium text-slate-800">
                        {u.name}
                        {u.id === me?.id && <span className="ml-2 text-xs text-slate-400">(tu)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLES[u.role] ?? ''}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    {u.id !== me?.id && (
                      <button onClick={() => handleDelete(u.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
