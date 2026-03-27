import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTestResults } from '../api/testResults'
import { getPatients } from '../api/patients'

const TEST_CATALOG = {
  hematology:      'Hematologie',
  biochemistry:    'Biochimie',
  hormones:        'Hormoni și Endocrinologie',
  immunology:      'Imunologie și Inflamație',
  serology:        'Serologie - Boli Infecțioase',
  vitamins:        'Vitamine și Minerale',
  urine:           'Sumar de Urină',
  coagulation:     'Coagulare',
  tumor_markers:   'Markeri Tumorali',
  microbiology:    'Microbiologie',
  allergy:         'Alergii și Imunoglobuline',
}

const STATUS_LABELS = {
  normal:    'Normal',
  abnormal:  'Anormal',
  critical:  'Critic',
  pending:   'În așteptare',
  completed: 'Finalizat',
  reviewed:  'Revizuit',
}

const STATUS_STYLES = {
  normal:    'bg-green-100 text-green-700',
  abnormal:  'bg-red-100 text-red-700',
  critical:  'bg-red-200 text-red-800 font-semibold',
  pending:   'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  reviewed:  'bg-green-100 text-green-700',
}

export default function TestResults() {
  const navigate = useNavigate()
  const [results, setResults]   = useState([])
  const [patients, setPatients] = useState({})
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    Promise.all([getTestResults(), getPatients()])
      .then(([rRes, pRes]) => {
        setResults(rRes.data)
        const map = {}
        pRes.data.forEach(p => { map[p.id] = p.title.rendered })
        setPatients(map)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = results.filter(r => {
    const patientName = patients[r.meta?.patient_id] ?? ''
    const category    = TEST_CATALOG[r.meta?.test_category] ?? r.meta?.test_category ?? ''
    const matchSearch = search === '' ||
      patientName.toLowerCase().includes(search.toLowerCase()) ||
      category.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || r.meta?.result_status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rezultate analize</h1>
          <p className="text-slate-500 text-sm mt-0.5">{results.length} total</p>
        </div>
        <button
          onClick={() => navigate('/rezultate-analize/nou')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Adaugă analiză
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <input
          type="search"
          placeholder="Caută după pacient sau analiză…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Toate statusurile</option>
          <option value="pending">În așteptare</option>
          <option value="normal">Normal</option>
          <option value="abnormal">Anormal</option>
          <option value="critical">Critic</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-slate-400 text-sm">Se încarcă…</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-400 text-sm">Nu s-au găsit rezultate.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const status   = r.meta?.result_status ?? 'pending'
            const category = r.meta?.test_category ?? ''
            const date     = r.meta?.test_date ?? ''
            const patId    = r.meta?.patient_id
            const patName  = patients[patId] ?? `Patient #${patId}`
            return (
              <div
                key={r.id}
                onClick={() => navigate(`/pacienti/${patId}`)}
                className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div>
                  <p className="font-medium text-slate-800 capitalize">
                    {TEST_CATALOG[category] ?? category}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {patName}{date ? ` · ${date}` : ''}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}>
                  {STATUS_LABELS[status] ?? status}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
