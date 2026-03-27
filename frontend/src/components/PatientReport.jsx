import { forwardRef } from 'react'

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

const STATUS_LABELS = {
  normal:    { label: 'Normal',          color: '#15803d' },
  abnormal:  { label: 'Anormal',         color: '#b91c1c' },
  critical:  { label: 'Critic',          color: '#7f1d1d' },
  pending:   { label: 'În așteptare',    color: '#92400e' },
  completed: { label: 'Finalizat',       color: '#1d4ed8' },
  reviewed:  { label: 'Revizuit',        color: '#166534' },
}

const PatientReport = forwardRef(function PatientReport({ patient, results }, ref) {
  const today = new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div ref={ref} className="print-report" style={{ fontFamily: 'Arial, sans-serif', color: '#1e293b', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>Clinic App</h1>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Raport pacient · Tipărit {today}</p>
      </div>

      {/* Patient info */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px' }}>{patient?.name}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '13px' }}>
          {[
            ['Data nașterii', patient?.dob],
            ['Sex',           patient?.gender],
            ['Telefon',       patient?.phone],
            ['Email',         patient?.email],
            ['Adresă',        patient?.address],
            ['Asigurat',      patient?.insured === 'yes' ? 'Da' : patient?.insured === 'no' ? 'Nu' : null],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label}>
              <span style={{ color: '#64748b' }}>{label}: </span>
              <span style={{ fontWeight: '600' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Test results */}
      <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>
        Rezultate analize ({results.length})
      </h2>

      {results.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>Nu există rezultate de analize.</p>
      ) : (
        results.map((r, idx) => {
          const status     = r.status ?? 'pending'
          const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.pending
          let resultData   = {}
          try { resultData = JSON.parse(r.data ?? '{}') } catch { /* empty */ }
          const entries = Object.entries(resultData).filter(([, v]) => v !== '' && v !== null && v !== undefined)

          return (
            <div key={r.id} style={{ marginBottom: '32px', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#eff6ff', padding: '8px 12px', borderRadius: '6px 6px 0 0', borderLeft: '4px solid #2563eb' }}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {idx + 1}. {TEST_CATALOG[r.category] ?? r.category}
                  </span>
                  {r.date && <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>{r.date}</span>}
                </div>
                <span style={{ fontSize: '11px', fontWeight: '600', color: statusInfo.color, background: '#fff', padding: '2px 8px', borderRadius: '12px', border: `1px solid ${statusInfo.color}` }}>
                  {statusInfo.label}
                </span>
              </div>

              {entries.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '6px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>Parametru</th>
                      <th style={{ padding: '6px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>Valoare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(([key, value], i) => (
                      <tr key={key} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={{ padding: '5px 12px', borderBottom: '1px solid #f1f5f9', color: '#475569', textTransform: 'capitalize' }}>
                          {key.replace(/_/g, ' ')}
                        </td>
                        <td style={{ padding: '5px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: '600' }}>
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {r.notes && (
                <div style={{ background: '#fffbeb', padding: '8px 12px', fontSize: '12px', borderRadius: '0 0 6px 6px', borderTop: '1px solid #fde68a' }}>
                  <span style={{ color: '#92400e', fontWeight: '600' }}>Notițe: </span>{r.notes}
                </div>
              )}
            </div>
          )
        })
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '32px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
        Raport generat de Clinic App · {today}
      </div>
    </div>
  )
})

export default PatientReport
