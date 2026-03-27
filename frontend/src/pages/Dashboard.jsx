import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, FlaskConical, ShieldCheck, Plus, Pencil, Trash2 } from 'lucide-react'
import { getPatients, createPatient, deletePatient } from '../api/patients'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const FILTERS = ['Toți', 'Asigurați', 'Neasigurați']

export default function Dashboard() {
  const navigate = useNavigate()
  const { role, tenant } = useAuth()
  const canEdit = role === 'ADMIN' || role === 'FRONT_DESK'

  const [patients, setPatients]     = useState([])
  const [analytics, setAnalytics]   = useState({ totalPatients: 0, totalTests: 0, monthlyPatients: [] })
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState('All')
  const [showForm, setShowForm]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [form, setForm] = useState({ name: '', cnp: '', dob: '', gender: '', phone: '', email: '', address: '', insured: '' })

  useEffect(() => {
    Promise.all([getPatients(), api.get('/statistici')])
      .then(([pRes, aRes]) => {
        setPatients(pRes.data)
        setAnalytics(aRes.data)
      })
      .catch(err => setError(err.response?.data?.message ?? err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'Toți'       ? true :
      filter === 'Asigurați'  ? p.insured === 'yes' :
      filter === 'Neasigurați'? p.insured === 'no'  : true
    return matchSearch && matchFilter
  })

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await createPatient(form)
      setPatients(prev => [res.data, ...prev])
      setAnalytics(a => ({ ...a, totalPatients: a.totalPatients + 1 }))
      setShowForm(false)
      setForm({ name: '', cnp: '', dob: '', gender: '', phone: '', email: '', address: '', insured: '' })
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Ștergi acest pacient? Acțiunea este ireversibilă.')) return
    try {
      await deletePatient(id)
      setPatients(prev => prev.filter(p => p.id !== id))
      setAnalytics(a => ({ ...a, totalPatients: a.totalPatients - 1 }))
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
    }
  }

  const insuredCount = patients.filter(p => p.insured === 'yes').length

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panou principal</h1>
          <p className="text-slate-400 text-sm mt-0.5">{tenant?.name}</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} /> Adaugă pacient
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Add patient form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Pacient nou</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nume complet *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">CNP *</label>
                <input
                  required
                  value={form.cnp}
                  onChange={e => setForm(f => ({ ...f, cnp: e.target.value.replace(/\D/g, '').slice(0, 13) }))}
                  maxLength={13}
                  pattern="\d{13}"
                  title="CNP-ul trebuie să conțină exact 13 cifre"
                  placeholder="1234567890123"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wider"
                />
                <p className="text-xs text-slate-400 mt-1">{form.cnp.length}/13 cifre</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Data nașterii</label>
                <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Telefon</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Sex</label>
                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Selectează —</option>
                  <option value="male">Masculin</option>
                  <option value="female">Feminin</option>
                  <option value="other">Alt</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Asigurat</label>
                <select value={form.insured} onChange={e => setForm(f => ({ ...f, insured: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Selectează —</option>
                  <option value="yes">Da</option>
                  <option value="no">Nu</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Adresă</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">Anulează</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-60">
                {saving ? 'Se salvează…' : 'Salvează pacient'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Top row: Analytics chart (left) + Stats cards (right) */}
      <div className="grid grid-cols-5 gap-4">

        {/* Analytics chart — 3/5 width */}
        <div className="col-span-3 bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Înregistrări pacienți — Ultimele 6 luni</h2>
          {analytics.monthlyPatients.length === 0 ? (
            <p className="text-slate-400 text-sm py-16 text-center">Date insuficiente momentan</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={analytics.monthlyPatients} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="patientGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  formatter={(v) => [v, 'Patients']}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#patientGrad)" dot={{ r: 4, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stats cards — 2/5 width, stacked */}
        <div className="col-span-2 flex flex-col gap-4">
          {[
            { label: 'Total pacienți',    value: analytics.totalPatients, icon: Users,        color: 'bg-blue-50 text-blue-600'       },
            { label: 'Analize efectuate', value: analytics.totalTests,    icon: FlaskConical, color: 'bg-violet-50 text-violet-600'   },
            { label: 'Asigurați',         value: insuredCount,            icon: ShieldCheck,  color: 'bg-emerald-50 text-emerald-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 flex-1">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{loading ? '—' : value}</p>
                <p className="text-slate-400 text-sm">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patient table */}
      <div className="bg-white rounded-2xl border border-slate-100">
        {/* Table header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filter === f ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {f}
                {f === 'Toți' && <span className="ml-1.5 text-xs opacity-70">{patients.length}</span>}
              </button>
            ))}
          </div>
          <input
            type="search"
            placeholder="Caută pacienți…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-slate-400 text-sm p-6">Se încarcă…</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-sm p-6">Niciun pacient găsit.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Nume complet</th>
                <th className="px-5 py-3 font-medium">Data nașterii</th>
                <th className="px-5 py-3 font-medium">Sex</th>
                <th className="px-5 py-3 font-medium">Telefon</th>
                <th className="px-5 py-3 font-medium">Asigurat</th>
                <th className="px-5 py-3 font-medium">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}
                  onClick={() => navigate(`/pacienti/${p.id}`)}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {p.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                      </div>
                      {p.name}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{p.dob || '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{p.gender === 'male' ? 'Masculin' : p.gender === 'female' ? 'Feminin' : p.gender ? 'Altul' : '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{p.phone || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.insured === 'yes' ? 'bg-emerald-100 text-emerald-700' :
                      p.insured === 'no'  ? 'bg-red-100 text-red-600'         :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {p.insured === 'yes' ? 'Asigurat' : p.insured === 'no' ? 'Neasigurat' : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/pacienti/${p.id}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil size={15} />
                      </button>
                      {canEdit && (
                        <button onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
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
