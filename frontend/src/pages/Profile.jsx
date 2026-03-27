import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const TIER_LIMITS = { STARTER: 100, BASIC: 500, PRO: 1000, ENTERPRISE: 5000 }
const TIER_COLORS = {
  STARTER:    'bg-slate-100 text-slate-600',
  BASIC:      'bg-blue-100 text-blue-700',
  PRO:        'bg-violet-100 text-violet-700',
  ENTERPRISE: 'bg-amber-100 text-amber-700',
}

export default function Profile() {
  const { user, tenant, role, updateTenant } = useAuth()
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [form, setForm]         = useState({ name: '', logoUrl: '' })

  useEffect(() => {
    api.get('/profil')
      .then(r => {
        setProfile(r.data)
        setForm({ name: r.data.name, logoUrl: r.data.logoUrl || '' })
      })
      .catch(err => setError(err.response?.data?.message ?? err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.put('/profil', form)
      setProfile(res.data)
      updateTenant({ name: res.data.name, logoUrl: res.data.logoUrl })
      setEditing(false)
      setSuccess('Profilul a fost actualizat.')
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="p-6 text-slate-400 text-sm">Se încarcă…</p>

  const tier    = profile?.subscription?.tier    ?? 'STARTER'
  const status  = profile?.subscription?.status  ?? 'TRIAL'
  const limit   = TIER_LIMITS[tier]

  return (
    <div className="p-6 max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Profil</h1>

      {error   && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{success}</div>}

      {/* Lab info card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center gap-4 mb-5">
          {profile?.logoUrl ? (
            <img src={profile.logoUrl} alt={profile.name}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
              {profile?.name?.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-800">{profile?.name}</h2>
            <p className="text-sm text-slate-400">{profile?.email}</p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Numele laboratorului</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">URL logo</label>
              <input type="url" value={form.logoUrl} placeholder="https://…"
                onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setEditing(false)}
                className="flex-1 px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">Anulează</button>
              <button type="submit" disabled={saving}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-60">
                {saving ? 'Se salvează…' : 'Salvează'}
              </button>
            </div>
          </form>
        ) : (
          role === 'ADMIN' && (
            <button onClick={() => setEditing(true)}
              className="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors">
              Editează profilul
            </button>
          )
        )}
      </div>

      {/* Subscription card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
        <h3 className="font-semibold text-slate-700">Abonament</h3>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${TIER_COLORS[tier]}`}>
            {tier}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
            status === 'TRIAL'  ? 'bg-yellow-100 text-yellow-700'  :
            'bg-red-100 text-red-600'
          }`}>
            {status}
          </span>
        </div>
        <p className="text-sm text-slate-500">Până la <span className="font-medium text-slate-700">{limit}</span> pacienți pe acest plan.</p>
      </div>

      {/* Current user card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-700 mb-3">Conectat ca</h3>
        <p className="text-sm text-slate-700 font-medium">{user?.name}</p>
        <p className="text-sm text-slate-400">{user?.email}</p>
        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium capitalize">
          {user?.role?.replace('_', ' ')}
        </span>
      </div>
    </div>
  )
}
