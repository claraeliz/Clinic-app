import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { getPatients, getPatient, createPatient, updatePatient, deletePatient, sendReportEmail } from '../api/patients'
import { getTestResults } from '../api/testResults'
import { useAuth } from '../context/AuthContext'
import PatientReport from '../components/PatientReport'
import { Pencil, Trash2, Printer, Plus, X, FlaskConical, ClipboardList, SquarePen, Mail } from 'lucide-react'

const STATUS_STYLES = {
  normal:    'bg-green-100 text-green-700',
  abnormal:  'bg-red-100 text-red-700',
  critical:  'bg-red-200 text-red-800 font-semibold',
  pending:   'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  reviewed:  'bg-green-100 text-green-700',
}

const STATUS_LABELS = {
  normal:    'Normal',
  abnormal:  'Anormal',
  critical:  'Critic',
  pending:   'În așteptare',
  completed: 'Finalizat',
  reviewed:  'Revizuit',
}

const GENDER_LABELS = {
  male:   'Masculin',
  female: 'Feminin',
  other:  'Altul',
}

const TEST_CATALOG = {
  hematology:    'Hematologie',
  biochemistry:  'Biochimie',
  hormones:      'Hormoni și Endocrinologie',
  immunology:    'Imunologie și Inflamație',
  serology:      'Serologie - Boli Infecțioase',
  vitamins:      'Vitamine și Minerale',
  urine:         'Sumar de Urină',
  coagulation:   'Coagulare',
  tumor_markers: 'Markeri Tumorali',
  microbiology:  'Microbiologie',
  allergy:       'Alergii și Imunoglobuline',
}

const FIELD_LABELS = {
  wbc: 'WBC', rbc: 'RBC', hemoglobin: 'Hemoglobin', hematocrit: 'Hematocrit',
  mcv: 'MCV', mch: 'MCH', mchc: 'MCHC', platelets: 'Trombocite',
  neutrophils: 'Neutrofile', lymphocytes: 'Limfocite',
  glucose: 'Glucoză (a jeun)', urea: 'Uree', creatinine: 'Creatinină',
  uric_acid: 'Acid uric', cholesterol: 'Colesterol total', triglycerides: 'Trigliceride',
  hdl: 'HDL', ldl: 'LDL', alt: 'ALT', ast: 'AST', bilirubin_total: 'Bilirubină totală',
  tsh: 'TSH', ft4: 'T4 liber', ft3: 'T3 liber', lh: 'LH', fsh: 'FSH',
  prolactin: 'Prolactină', testosterone: 'Testosteron', cortisol: 'Cortizol (dimineața)',
  insulin: 'Insulină (a jeun)', hba1c: 'HbA1c',
  crp: 'CRP', esr: 'VSH', rf: 'Factor reumatoid', ana: 'ANA', anca: 'ANCA',
  complement_c3: 'Complement C3', complement_c4: 'Complement C4',
  hbsag: 'HBsAg', anti_hcv: 'Anti-HCV', hiv: 'HIV Ag/Ab', vdrl: 'VDRL/RPR',
  toxo_igg: 'Toxo IgG', toxo_igm: 'Toxo IgM', rubella_igg: 'Rubeolă IgG',
  cmv_igg: 'CMV IgG', h_pylori: 'H. pylori IgG',
  vitamin_d: 'Vitamina D (25-OH)', vitamin_b12: 'Vitamina B12', folate: 'Folat',
  ferritin: 'Ferritină', iron: 'Fier seric', calcium: 'Calciu', magnesium: 'Magneziu', zinc: 'Zinc',
  urine_color: 'Culoare', urine_clarity: 'Claritate', urine_ph: 'pH',
  urine_sg: 'Densitate', urine_protein: 'Proteine', urine_glucose: 'Glucoză',
  urine_blood: 'Sânge', urine_leukocytes: 'Leucocite', urine_rbc: 'RBC',
  pt: 'PT', inr: 'INR', aptt: 'aPTT', fibrinogen: 'Fibrinogen', d_dimer: 'D-Dimeri',
  cea: 'CEA', afp: 'AFP', ca125: 'CA-125', ca199: 'CA 19-9', psa: 'PSA', ca153: 'CA 15-3',
  specimen_type: 'Tip specimen', organism: 'Organism', colony_count: 'Număr colonii',
  sensitivity: 'Sensibilitate', resistance: 'Rezistență',
  total_ige: 'IgE total', ige_foods: 'IgE alimente', ige_inhale: 'IgE inhalante',
  igg: 'IgG', iga: 'IgA', igm: 'IgM',
}

export default function PatientsView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const printRef = useRef()
  const canEdit = role === 'ADMIN' || role === 'FRONT_DESK'

  const [patients, setPatients]         = useState([])
  const [loadingList, setLoadingList]   = useState(true)
  const [search, setSearch]             = useState('')
  const [showForm, setShowForm]         = useState(false)
  const [saving, setSaving]             = useState(false)
  const [listError, setListError]       = useState('')
  const [form, setForm] = useState({ name: '', dob: '', gender: '', phone: '', email: '', address: '', insured: '' })

  const [patient, setPatient]               = useState(null)
  const [results, setResults]               = useState([])
  const [loadingDetail, setLoadingDetail]   = useState(false)
  const [expanded, setExpanded]             = useState(null)
  const [editing, setEditing]               = useState(false)
  const [editSaving, setEditSaving]         = useState(false)
  const [deleting, setDeleting]             = useState(false)
  const [sending, setSending]               = useState(false)
  const [editForm, setEditForm]             = useState({})

  const handlePrint = useReactToPrint({ contentRef: printRef })

  useEffect(() => {
    getPatients()
      .then(r => setPatients(r.data))
      .catch(err => setListError(err.response?.data?.message ?? err.message))
      .finally(() => setLoadingList(false))
  }, [])

  useEffect(() => {
    if (!id) { setPatient(null); setResults([]); return }
    setLoadingDetail(true)
    setEditing(false)
    Promise.all([getPatient(id), getTestResults(id)])
      .then(([pRes, rRes]) => {
        setPatient(pRes.data)
        setEditForm({
          name: pRes.data.name ?? '', dob: pRes.data.dob ?? '',
          gender: pRes.data.gender ?? '', phone: pRes.data.phone ?? '',
          email: pRes.data.email ?? '', address: pRes.data.address ?? '',
          insured: pRes.data.insured ?? '',
        })
        setResults(rRes.data)
      })
      .finally(() => setLoadingDetail(false))
  }, [id])

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const initials = n => n.split(' ').map(w => w[0]).filter(Boolean).slice(0,2).join('').toUpperCase()

  async function handleCreate(e) {
    e.preventDefault(); setSaving(true); setListError('')
    try {
      const res = await createPatient(form)
      setPatients(prev => [res.data, ...prev])
      setShowForm(false)
      setForm({ name: '', cnp: '', dob: '', gender: '', phone: '', email: '', address: '', insured: '' })
    } catch (err) { setListError(err.response?.data?.message ?? err.message) }
    finally { setSaving(false) }
  }

  async function handleSave(e) {
    e.preventDefault(); setEditSaving(true)
    try {
      const res = await updatePatient(id, editForm)
      setPatient(res.data)
      setPatients(prev => prev.map(p => p.id === res.data.id ? res.data : p))
      setEditing(false)
    } finally { setEditSaving(false) }
  }

  async function handleSendEmail() {
    setSending(true)
    try {
      await sendReportEmail(id)
      alert('Email trimis cu succes!')
    } catch (err) {
      alert(err.response?.data?.message ?? 'Eroare la trimiterea emailului.')
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(patientId) {
    if (!window.confirm('Ștergi acest pacient? Acțiunea este ireversibilă.')) return
    setDeleting(true)
    try {
      await deletePatient(patientId)
      setPatients(prev => prev.filter(p => p.id !== Number(patientId)))
      navigate('/pacienti')
    } finally { setDeleting(false) }
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Pacienți</h1>
        {canEdit && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Plus size={16} /> Adaugă pacient
          </button>
        )}
      </div>

      {listError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{listError}</div>
      )}

      {/* Add patient form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Pacient nou</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
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
                  <option value="">— Selectează —</option><option value="male">Masculin</option><option value="female">Feminin</option><option value="other">Alt</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Asigurat</label>
                <select value={form.insured} onChange={e => setForm(f => ({ ...f, insured: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Selectează —</option><option value="yes">Da</option><option value="no">Nu</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Adresă</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">Anulează</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-60">
                {saving ? 'Se salvează…' : 'Salvează pacient'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Selected patient detail */}
      {id && (
        <div className="bg-white rounded-2xl border border-slate-100">
          {loadingDetail ? (
            <p className="p-6 text-slate-400 text-sm">Se încarcă…</p>
          ) : !patient ? (
            <p className="p-6 text-slate-400 text-sm">Pacient negăsit.</p>
          ) : editing ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800">Editează pacient</h2>
                <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nume complet *</label>
                  <input required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {[{ key: 'dob', label: 'Data nașterii', type: 'date' }, { key: 'phone', label: 'Telefon', type: 'tel' }, { key: 'email', label: 'Email', type: 'email' }].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                    <input type={f.type} value={editForm[f.key]} onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Sex</label>
                  <select value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Selectează —</option><option value="male">Masculin</option><option value="female">Feminin</option><option value="other">Alt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Asigurat</label>
                  <select value={editForm.insured} onChange={e => setEditForm(f => ({ ...f, insured: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Selectează —</option><option value="yes">Da</option><option value="no">Nu</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Adresă</label>
                  <input value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2 flex gap-2 justify-end">
                  <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">Anulează</button>
                  <button type="submit" disabled={editSaving} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-60">
                    {editSaving ? 'Se salvează…' : 'Salvează'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-6">
              {/* Patient header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 font-bold text-lg flex items-center justify-center flex-shrink-0">
                    {initials(patient.name)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{patient.name}</h2>
                    {patient.gender && <p className="text-sm text-slate-400">{GENDER_LABELS[patient.gender] ?? patient.gender}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {canEdit && (
                    <>
                      <button onClick={() => setEditing(true)}
                        className="p-2 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(id)} disabled={deleting}
                        className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-60" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Patient info grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Data nașterii', value: patient.dob },
                  { label: 'Telefon',       value: patient.phone },
                  { label: 'Email',         value: patient.email },
                  { label: 'Adresă',        value: patient.address },
                  { label: 'Asigurat',      value: patient.insured === 'yes' ? 'Da' : patient.insured === 'no' ? 'Nu' : null },
                ].filter(i => i.value).map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-slate-700">{value}</p>
                  </div>
                ))}
              </div>

              {/* Test results */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700">Rezultate analize {results.length > 0 && `(${results.length})`}</h3>
                {results.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button onClick={handlePrint}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors" title="Tipărește">
                      <Printer size={14} /> Tipărește
                    </button>
                    <button onClick={handleSendEmail} disabled={sending}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors disabled:opacity-60" title="Trimite email">
                      <Mail size={14} /> {sending ? 'Se trimite…' : 'Trimite email'}
                    </button>
                  </div>
                )}
              </div>
              {results.length === 0 ? (
                <p className="text-slate-400 text-sm">Nu există rezultate de analize.</p>
              ) : (
                <div className="space-y-2">
                  {results.map(r => {
                    const isOpen = expanded === r.id
                    let resultData = {}
                    try { resultData = JSON.parse(r.data ?? '{}') } catch { /* empty */ }
                    const entries = Object.entries(resultData).filter(([, v]) => v !== '' && v !== null)
                    return (
                      <div key={r.id} className="border border-slate-100 rounded-xl overflow-hidden">
                        <div onClick={() => setExpanded(isOpen ? null : r.id)}
                          className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                          <div>
                            <p className="font-medium text-slate-700 text-sm">{TEST_CATALOG[r.category] ?? r.category?.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-slate-400">{r.date}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status] ?? STATUS_STYLES.pending}`}>{STATUS_LABELS[r.status] ?? r.status}</span>
                            {(role === 'ADMIN' || role === 'MEDIC') && (
                              <button
                                onClick={e => { e.stopPropagation(); navigate(`/rezultate-analize/${r.id}/editeaza`) }}
                                title="Editează analiza"
                                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                <SquarePen size={14} />
                              </button>
                            )}
                            <span className="text-slate-300 text-xs">{isOpen ? '▲' : '▼'}</span>
                          </div>
                        </div>
                        {isOpen && (
                          <div className="border-t border-slate-50 px-4 py-3">
                            {entries.length > 0 ? (
                              <table className="w-full text-sm mb-2">
                                <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                                  <th className="pb-2 font-medium">Parametru</th><th className="pb-2 font-medium">Valoare</th>
                                </tr></thead>
                                <tbody>{entries.map(([k, v]) => (
                                  <tr key={k} className="border-b border-slate-50 last:border-0">
                                    <td className="py-1.5 text-slate-500">{FIELD_LABELS[k] ?? k.replace(/_/g, ' ')}</td>
                                    <td className="py-1.5 font-medium text-slate-800">{v}</td>
                                  </tr>
                                ))}</tbody>
                              </table>
                            ) : <p className="text-slate-400 text-sm mb-2">Niciun parametru înregistrat.</p>}
                            {r.notes && (
                              <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2 text-sm text-slate-600">
                                <span className="font-medium text-yellow-700">Notițe: </span>{r.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Patients list */}
      <div className="bg-white rounded-2xl border border-slate-100">
        <div className="p-4 border-b border-slate-100">
          <input type="search" placeholder="Caută pacienți…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {loadingList ? (
          <p className="p-6 text-slate-400 text-sm">Se încarcă…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-slate-400 text-sm">Nu s-au găsit pacienți.</p>
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
                <tr key={p.id} onClick={() => navigate(`/pacienti/${p.id}`)}
                  className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors ${String(p.id) === String(id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-5 py-3 font-medium text-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {initials(p.name)}
                      </div>
                      {p.name}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{p.dob || '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{GENDER_LABELS[p.gender] ?? (p.gender || '—')}</td>
                  <td className="px-5 py-3 text-slate-500">{p.phone || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.insured === 'yes' ? 'bg-emerald-100 text-emerald-700' : p.insured === 'no' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                      {p.insured === 'yes' ? 'Asigurat' : p.insured === 'no' ? 'Neasigurat' : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {(role === 'ADMIN' || role === 'MEDIC') && (
                        <button
                          onClick={() => navigate(`/rezultate-analize/nou?patient=${p.id}`)}
                          title="Adaugă analiză"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                          <FlaskConical size={13} /> Adaugă analiză
                        </button>
                      )}
                      {(p._count?.testResults ?? 0) > 0 && (
                        <button
                          onClick={() => navigate(`/pacienti/${p.id}`)}
                          title="Vezi rezultate"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <ClipboardList size={13} /> Rezultate ({p._count.testResults})
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

      <div className="hidden">
        {patient && <PatientReport ref={printRef} patient={patient} results={results} />}
      </div>
    </div>
  )
}
