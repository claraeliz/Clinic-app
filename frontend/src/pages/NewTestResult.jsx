import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getPatients } from '../api/patients'
import { getTestResult, createTestResult, updateTestResult } from '../api/testResults'

// Mirror of the PHP test catalog
const TEST_CATALOG = [
  {
    key: 'hematology',
    label: 'Hematologie',
    fields: [
      { key: 'wbc',         label: 'WBC',          unit: '×10³/μL',  ref: '4.5–11.0' },
      { key: 'rbc',         label: 'RBC',          unit: '×10⁶/μL',  ref: 'M 4.5–5.9 / F 4.0–5.2' },
      { key: 'hemoglobin',  label: 'Hemoglobin',   unit: 'g/dL',     ref: 'M 13.5–17.5 / F 12.0–15.5' },
      { key: 'hematocrit',  label: 'Hematocrit',   unit: '%',        ref: 'M 41–53 / F 36–46' },
      { key: 'mcv',         label: 'MCV',          unit: 'fL',       ref: '80–100' },
      { key: 'mch',         label: 'MCH',          unit: 'pg',       ref: '27–33' },
      { key: 'mchc',        label: 'MCHC',         unit: 'g/dL',     ref: '32–36' },
      { key: 'platelets',   label: 'Trombocite',   unit: '×10³/μL',  ref: '150–400' },
      { key: 'neutrophils', label: 'Neutrofile',   unit: '%',        ref: '50–70' },
      { key: 'lymphocytes', label: 'Limfocite',    unit: '%',        ref: '20–40' },
    ],
  },
  {
    key: 'biochemistry',
    label: 'Biochimie',
    fields: [
      { key: 'glucose',     label: 'Glucoză (a jeun)',   unit: 'mg/dL', ref: '70–100' },
      { key: 'urea',        label: 'Uree',               unit: 'mg/dL', ref: '10–50' },
      { key: 'creatinine',  label: 'Creatinină',         unit: 'mg/dL', ref: 'M 0.7–1.2 / F 0.5–1.0' },
      { key: 'uric_acid',   label: 'Acid uric',          unit: 'mg/dL', ref: 'M 3.4–7.0 / F 2.4–6.0' },
      { key: 'cholesterol', label: 'Colesterol total',   unit: 'mg/dL', ref: '<200' },
      { key: 'triglycerides', label: 'Trigliceride',     unit: 'mg/dL', ref: '<150' },
      { key: 'hdl',         label: 'HDL',                unit: 'mg/dL', ref: '>40 M / >50 F' },
      { key: 'ldl',         label: 'LDL',                unit: 'mg/dL', ref: '<100' },
      { key: 'alt',         label: 'ALT',                unit: 'U/L',   ref: '7–56' },
      { key: 'ast',         label: 'AST',                unit: 'U/L',   ref: '10–40' },
      { key: 'bilirubin_total', label: 'Bilirubină totală', unit: 'mg/dL', ref: '0.2–1.2' },
    ],
  },
  {
    key: 'hormones',
    label: 'Hormoni și Endocrinologie',
    fields: [
      { key: 'tsh',    label: 'TSH',    unit: 'mIU/L',  ref: '0.4–4.0' },
      { key: 'ft4',    label: 'T4 liber', unit: 'ng/dL',  ref: '0.8–1.8' },
      { key: 'ft3',    label: 'T3 liber', unit: 'pg/mL',  ref: '2.3–4.2' },
      { key: 'lh',     label: 'LH',     unit: 'mIU/mL', ref: 'Variabil' },
      { key: 'fsh',    label: 'FSH',    unit: 'mIU/mL', ref: 'Variabil' },
      { key: 'prolactin', label: 'Prolactină', unit: 'ng/mL', ref: 'M <20 / F <25' },
      { key: 'testosterone', label: 'Testosteron', unit: 'ng/dL', ref: 'M 270–1070 / F 15–70' },
      { key: 'cortisol', label: 'Cortizol (dimineața)', unit: 'μg/dL', ref: '6–23' },
      { key: 'insulin',  label: 'Insulină (a jeun)', unit: 'μIU/mL', ref: '2–25' },
      { key: 'hba1c',    label: 'HbA1c',            unit: '%',      ref: '<5.7' },
    ],
  },
  {
    key: 'immunology',
    label: 'Imunologie și Inflamație',
    fields: [
      { key: 'crp',    label: 'CRP',     unit: 'mg/L',   ref: '<5' },
      { key: 'esr',    label: 'VSH',     unit: 'mm/hr',  ref: 'M <15 / F <20' },
      { key: 'rf',     label: 'Factor reumatoid', unit: 'IU/mL', ref: '<14' },
      { key: 'ana',    label: 'ANA',     unit: '',       ref: 'Negativ' },
      { key: 'anca',   label: 'ANCA',    unit: '',       ref: 'Negativ' },
      { key: 'complement_c3', label: 'Complement C3', unit: 'mg/dL', ref: '90–180' },
      { key: 'complement_c4', label: 'Complement C4', unit: 'mg/dL', ref: '16–47' },
    ],
  },
  {
    key: 'serology',
    label: 'Serologie - Boli Infecțioase',
    fields: [
      { key: 'hbsag',   label: 'HBsAg',       unit: '', ref: 'Nereactiv' },
      { key: 'anti_hcv', label: 'Anti-HCV',   unit: '', ref: 'Nereactiv' },
      { key: 'hiv',     label: 'HIV Ag/Ab',   unit: '', ref: 'Nereactiv' },
      { key: 'vdrl',    label: 'VDRL/RPR',    unit: '', ref: 'Nereactiv' },
      { key: 'toxo_igg', label: 'Toxo IgG',   unit: 'IU/mL', ref: '<3' },
      { key: 'toxo_igm', label: 'Toxo IgM',   unit: '', ref: 'Nereactiv' },
      { key: 'rubella_igg', label: 'Rubeolă IgG', unit: 'IU/mL', ref: '>10 imun' },
      { key: 'cmv_igg', label: 'CMV IgG',     unit: '',  ref: 'Nereactiv' },
      { key: 'h_pylori', label: 'H. pylori IgG', unit: '', ref: 'Nereactiv' },
    ],
  },
  {
    key: 'vitamins',
    label: 'Vitamine și Minerale',
    fields: [
      { key: 'vitamin_d', label: 'Vitamina D (25-OH)', unit: 'ng/mL', ref: '30–100' },
      { key: 'vitamin_b12', label: 'Vitamina B12',     unit: 'pg/mL', ref: '200–900' },
      { key: 'folate',    label: 'Folat',              unit: 'ng/mL', ref: '>4' },
      { key: 'ferritin',  label: 'Ferritină',          unit: 'ng/mL', ref: 'M 12–300 / F 10–120' },
      { key: 'iron',      label: 'Fier seric',         unit: 'μg/dL', ref: '60–170' },
      { key: 'calcium',   label: 'Calciu',             unit: 'mg/dL', ref: '8.5–10.5' },
      { key: 'magnesium', label: 'Magneziu',           unit: 'mg/dL', ref: '1.7–2.2' },
      { key: 'zinc',      label: 'Zinc',               unit: 'μg/dL', ref: '70–120' },
    ],
  },
  {
    key: 'urine',
    label: 'Sumar de Urină',
    fields: [
      { key: 'urine_color',    label: 'Culoare',        unit: '', ref: 'Galben/Galben pal' },
      { key: 'urine_clarity',  label: 'Claritate',      unit: '', ref: 'Clar' },
      { key: 'urine_ph',       label: 'pH',             unit: '', ref: '4.5–8.0' },
      { key: 'urine_sg',       label: 'Densitate',      unit: '', ref: '1.005–1.030' },
      { key: 'urine_protein',  label: 'Proteine',       unit: '', ref: 'Negativ' },
      { key: 'urine_glucose',  label: 'Glucoză',        unit: '', ref: 'Negativ' },
      { key: 'urine_blood',    label: 'Sânge',          unit: '', ref: 'Negativ' },
      { key: 'urine_leukocytes', label: 'Leucocite',   unit: '/HPF', ref: '0–5' },
      { key: 'urine_rbc',      label: 'RBC',            unit: '/HPF', ref: '0–2' },
    ],
  },
  {
    key: 'coagulation',
    label: 'Coagulare',
    fields: [
      { key: 'pt',      label: 'PT',             unit: 'secunde', ref: '11–14' },
      { key: 'inr',     label: 'INR',            unit: '',        ref: '0.8–1.2' },
      { key: 'aptt',    label: 'aPTT',           unit: 'secunde', ref: '25–35' },
      { key: 'fibrinogen', label: 'Fibrinogen',  unit: 'mg/dL',   ref: '200–400' },
      { key: 'd_dimer',  label: 'D-Dimeri',      unit: 'μg/mL',   ref: '<0.5' },
    ],
  },
  {
    key: 'tumor_markers',
    label: 'Markeri Tumorali',
    fields: [
      { key: 'cea',   label: 'CEA',   unit: 'ng/mL',  ref: '<3 (nefumător)' },
      { key: 'afp',   label: 'AFP',   unit: 'ng/mL',  ref: '<10' },
      { key: 'ca125', label: 'CA-125', unit: 'U/mL',  ref: '<35' },
      { key: 'ca199', label: 'CA 19-9', unit: 'U/mL', ref: '<37' },
      { key: 'psa',   label: 'PSA',   unit: 'ng/mL',  ref: '<4' },
      { key: 'ca153', label: 'CA 15-3', unit: 'U/mL', ref: '<30' },
    ],
  },
  {
    key: 'microbiology',
    label: 'Microbiologie',
    fields: [
      { key: 'specimen_type',  label: 'Tip specimen',   unit: '', ref: '' },
      { key: 'organism',       label: 'Organism',       unit: '', ref: 'Fără creștere' },
      { key: 'colony_count',   label: 'Număr colonii',  unit: 'CFU/mL', ref: '' },
      { key: 'sensitivity',    label: 'Sensibilitate',  unit: '', ref: '' },
      { key: 'resistance',     label: 'Rezistență',     unit: '', ref: '' },
    ],
  },
  {
    key: 'allergy',
    label: 'Alergii și Imunoglobuline',
    fields: [
      { key: 'total_ige',  label: 'IgE total',       unit: 'kU/L',  ref: '<100' },
      { key: 'ige_foods',  label: 'IgE alimente',    unit: '', ref: 'Nereactiv' },
      { key: 'ige_inhale', label: 'IgE inhalante',   unit: '', ref: 'Nereactiv' },
      { key: 'igg',        label: 'IgG',             unit: 'mg/dL', ref: '700–1600' },
      { key: 'iga',        label: 'IgA',             unit: 'mg/dL', ref: '70–400' },
      { key: 'igm',        label: 'IgM',             unit: 'mg/dL', ref: '40–230' },
    ],
  },
]

export default function NewTestResult() {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(editId)

  const [patients, setPatients]       = useState([])
  const [patientId, setPatientId]     = useState(searchParams.get('patient') ?? '')
  const [category, setCategory]       = useState('')
  const [date, setDate]               = useState(new Date().toISOString().slice(0, 10))
  const [status, setStatus]           = useState('pending')
  const [notes, setNotes]             = useState('')
  const [fieldValues, setFieldValues] = useState({})
  const [saving, setSaving]           = useState(false)
  const [loading, setLoading]         = useState(isEdit)
  const [error, setError]             = useState('')

  const selectedCatalog = TEST_CATALOG.find(t => t.key === category)

  useEffect(() => {
    getPatients().then(r => setPatients(r.data))
  }, [])

  // Load existing result when editing
  useEffect(() => {
    if (!isEdit) return
    getTestResult(editId)
      .then(r => {
        const result = r.data
        setPatientId(String(result.patientId))
        setCategory(result.category)
        setDate(result.date ?? new Date().toISOString().slice(0, 10))
        setStatus(result.status)
        setNotes(result.notes ?? '')
        try { setFieldValues(JSON.parse(result.data ?? '{}')) } catch { /* empty */ }
      })
      .catch(() => setError('Nu s-a putut încărca analiza.'))
      .finally(() => setLoading(false))
  }, [editId, isEdit])

  // Reset field values when category changes (create mode only)
  useEffect(() => {
    if (!isEdit) setFieldValues({})
  }, [category, isEdit])

  function setField(key, value) {
    setFieldValues(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!patientId) { setError('Selectează un pacient.'); return }
    if (!category)  { setError('Selectează o categorie de analiză.'); return }
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        await updateTestResult(editId, { category, date, status, notes, resultData: fieldValues })
      } else {
        await createTestResult({ patientId, category, date, status, notes, resultData: fieldValues })
      }
      navigate(`/pacienti/${patientId}`)
    } catch {
      setError('Salvarea a eșuat. Încearcă din nou.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-slate-400 text-sm">Se încarcă…</div>
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
          ‹ Înapoi
        </button>
        <h1 className="text-xl font-bold text-slate-800">{isEdit ? 'Editează analiza' : 'Analiză nouă'}</h1>
        <span />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
        )}

        {/* Patient */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Pacient</h2>
          <select
            value={patientId}
            onChange={e => setPatientId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Selectează pacient —</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Test info */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Informații analiză</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Categorie *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Selectează categoria —</option>
                {TEST_CATALOG.map(t => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Data analizei</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">În așteptare</option>
                <option value="normal">Normal</option>
                <option value="abnormal">Anormal</option>
                <option value="critical">Critic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic fields */}
        {selectedCatalog && (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">
              {selectedCatalog.label} — Parametri
            </h2>
            <div className="grid grid-cols-2 gap-x-5 gap-y-3">
              {selectedCatalog.fields.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {f.label}
                    {f.unit && <span className="text-slate-400 font-normal ml-1">({f.unit})</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={f.ref ? `ref: ${f.ref}` : ''}
                    value={fieldValues[f.key] ?? ''}
                    onChange={e => setField(f.key, e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Notițe</h2>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notițe clinice opționale…"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="px-5 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
            Anulează
          </button>
          <button type="submit" disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60">
            {saving ? 'Se salvează…' : 'Salvează analiza'}
          </button>
        </div>
      </form>
    </div>
  )
}
