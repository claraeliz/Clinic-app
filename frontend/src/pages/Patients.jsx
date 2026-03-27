import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPatients, createPatient } from '../api/patients'
import { useAuth } from '../context/AuthContext'

export default function Patients() {
  const { role } = useAuth()
  const navigate  = useNavigate()
  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [form, setForm] = useState({ name: '', dob: '', gender: '', phone: '', email: '', address: '', insured: '' })

  useEffect(() => {
    getPatients()
      .then(r => setPatients(r.data))
      .catch(err => setError(`Nu s-au putut încărca pacienții: ${err.response?.data?.message ?? err.message}`))
      .finally(() => setLoading(false))
  }, [])

  const filtered = patients.filter(p =>
    p.title.rendered.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await createPatient(form)
      setPatients(prev => [res.data, ...prev])
      setShowForm(false)
      setForm({ name: '', dob: '', gender: '', phone: '', email: '', address: '', insured: '' })
    } catch (err) {
      setError(`Nu s-a putut salva pacientul: ${err.response?.data?.message ?? err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pacienți</h1>
          <p className="text-slate-500 text-sm mt-0.5">{patients.length} înregistrați</p>
        </div>
        {role === 'front_desk' && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Adaugă pacient
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Search */}
      <input
        type="search"
        placeholder="Caută pacienți…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Add Patient form */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5">
          <h2 className="font-semibold text-slate-800 mb-4">Pacient nou</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Nume complet *</label>
              <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {[
              { key: 'dob', label: 'Data nașterii', type: 'date' },
              { key: 'phone', label: 'Telefon', type: 'tel' },
              { key: 'email', label: 'Email', type: 'email' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Sex</label>
              <select value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Selectează —</option>
                <option value="male">Masculin</option>
                <option value="female">Feminin</option>
                <option value="other">Altul</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Asigurat</label>
              <select value={form.insured} onChange={e => setForm(f => ({...f, insured: e.target.value}))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Selectează —</option>
                <option value="yes">Da</option>
                <option value="no">Nu</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Adresă</label>
              <input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2 flex gap-2 justify-end mt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Anulează</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60">
                {saving ? 'Se salvează…' : 'Salvează pacient'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Patient list */}
      {loading ? (
        <p className="text-slate-400 text-sm">Se încarcă…</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-400 text-sm">Nu s-au găsit pacienți.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/patients/${p.id}`)}
              className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div>
                <p className="font-medium text-slate-800">{p.title.rendered}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {p.meta?.patient_dob || ''} {p.meta?.patient_gender ? `· ${p.meta.patient_gender}` : ''}
                </p>
              </div>
              <span className="text-slate-300 text-lg">›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
