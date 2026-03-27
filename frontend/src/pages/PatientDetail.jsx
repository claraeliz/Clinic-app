import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { getPatient, updatePatient, deletePatient, sendReportEmail } from '../api/patients'
import { getTestResults } from '../api/testResults'
import { useAuth } from '../context/AuthContext'
import PatientReport from '../components/PatientReport'

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

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const printRef = useRef()

  const [patient, setPatient]       = useState(null)
  const [results, setResults]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState(null)
  const [editing, setEditing]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [sending, setSending]       = useState(false)
  const [form, setForm]             = useState({})

  useEffect(() => {
    Promise.all([getPatient(id), getTestResults(id)])
      .then(([pRes, rRes]) => {
        setPatient(pRes.data)
        setForm({
          name:    pRes.data.title.rendered,
          dob:     pRes.data.meta?.patient_dob     ?? '',
          gender:  pRes.data.meta?.patient_gender  ?? '',
          phone:   pRes.data.meta?.patient_phone   ?? '',
          email:   pRes.data.meta?.patient_email   ?? '',
          address: pRes.data.meta?.patient_address ?? '',
          insured: pRes.data.meta?.patient_insured ?? '',
        })
        setResults(rRes.data)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handlePrint = useReactToPrint({ contentRef: printRef })

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updatePatient(id, form)
      setPatient(res.data)
      setEditing(false)
    } finally {
      setSaving(false)
    }
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

  async function handleDelete() {
    if (!window.confirm('Ștergi acest pacient? Această acțiune nu poate fi anulată.')) return
    setDeleting(true)
    try {
      await deletePatient(id)
      navigate('/pacienti')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <p className="p-6 text-slate-400 text-sm">Se încarcă…</p>
  if (!patient) return <p className="p-6 text-slate-400 text-sm">Pacientul nu a fost găsit.</p>

  const name    = patient.title.rendered
  const meta    = patient.meta ?? {}

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/pacienti')}
          className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
          ‹ Pacienți
        </button>
        <div className="flex gap-2">
          <button onClick={handlePrint}
            className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
            Tipărire / PDF
          </button>
          <button onClick={handleSendEmail} disabled={sending}
            className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-60">
            {sending ? 'Se trimite…' : 'Trimite email'}
          </button>
          {role === 'front_desk' && !editing && (
            <>
              <button onClick={() => setEditing(true)}
                className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Editează
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="text-sm px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-60">
                {deleting ? 'Se șterge…' : 'Șterge'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Patient card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        {editing ? (
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
            <h2 className="col-span-2 font-semibold text-slate-800 mb-1">Editează pacient</h2>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Nume complet *</label>
              <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {[
              { key: 'dob',   label: 'Data nașterii', type: 'date'  },
              { key: 'phone', label: 'Telefon',        type: 'tel'   },
              { key: 'email', label: 'Email',          type: 'email' },
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
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Adresă</label>
              <input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
            <div className="col-span-2 flex gap-2 justify-end mt-1">
              <button type="button" onClick={() => setEditing(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Anulează</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60">
                {saving ? 'Se salvează…' : 'Salvează modificările'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-800 mb-4">{name}</h1>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {[
                ['Data nașterii', meta.patient_dob],
                ['Sex',           meta.patient_gender && (meta.patient_gender === 'male' ? 'Masculin' : meta.patient_gender === 'female' ? 'Feminin' : 'Altul')],
                ['Telefon',       meta.patient_phone],
                ['Email',         meta.patient_email],
                ['Adresă',        meta.patient_address],
                ['Asigurat',      meta.patient_insured && (meta.patient_insured === 'yes' ? 'Da' : 'Nu')],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <dt className="text-slate-400 min-w-[100px]">{label}</dt>
                  <dd className="text-slate-700 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>

      {/* Test results */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-800">Rezultate analize ({results.length})</h2>
      </div>

      {results.length === 0 ? (
        <p className="text-slate-400 text-sm">Nu există rezultate încă.</p>
      ) : (
        <div className="space-y-2">
          {results.map(r => {
            const status   = r.meta?.result_status ?? 'pending'
            const category = r.meta?.test_category ?? ''
            const date     = r.meta?.test_date ?? ''
            const notes    = r.meta?.result_notes ?? ''
            const isOpen   = expanded === r.id
            let resultData = {}
            try { resultData = JSON.parse(r.meta?.result_data ?? '{}') } catch { /* empty */ }
            const entries  = Object.entries(resultData).filter(([, v]) => v !== '' && v !== null && v !== undefined)

            return (
              <div key={r.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {/* Header row — clickable */}
                <div
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-800 capitalize">{category.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}>
                      {STATUS_LABELS[status] ?? status}
                    </span>
                    <span className="text-slate-300 text-sm">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    {entries.length > 0 ? (
                      <table className="w-full text-sm mb-3">
                        <thead>
                          <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                            <th className="pb-2 font-medium">Parametru</th>
                            <th className="pb-2 font-medium">Valoare</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map(([key, value]) => (
                            <tr key={key} className="border-b border-slate-50 last:border-0">
                              <td className="py-1.5 text-slate-500">{FIELD_LABELS[key] ?? key.replace(/_/g, ' ')}</td>
                              <td className="py-1.5 font-medium text-slate-800">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-slate-400 text-sm mb-3">Nu există valori înregistrate.</p>
                    )}
                    {notes && (
                      <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2 text-sm text-slate-600">
                        <span className="font-medium text-yellow-700">Notițe: </span>{notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Hidden printable report */}
      <div className="hidden">
        <PatientReport ref={printRef} patient={patient} results={results} />
      </div>
    </div>
  )
}
