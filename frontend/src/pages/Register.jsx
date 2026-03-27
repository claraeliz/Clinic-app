import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ labName: '', name: '', email: '', password: '', confirm: '', logoUrl: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      return setError('Parolele nu coincid.')
    }
    setError('')
    setLoading(true)
    try {
      await register(form.labName, form.name, form.email, form.password, form.logoUrl)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Înregistrarea a eșuat.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏥</div>
          <h1 className="text-2xl font-bold text-slate-800">Creează contul laboratorului</h1>
          <p className="text-slate-500 mt-1 text-sm">Perioadă de probă — fără card de credit</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {[
            { key: 'labName',  label: 'Nume laborator / clinică',  type: 'text',     placeholder: 'ex: Laborator Medical Cluj' },
            { key: 'name',     label: 'Numele tău complet',        type: 'text',     placeholder: 'ex: Dr. Ion Popescu' },
            { key: 'email',    label: 'Email',                     type: 'email',    placeholder: '' },
            { key: 'password', label: 'Parolă',                    type: 'password', placeholder: '' },
            { key: 'confirm',  label: 'Confirmă parola',           type: 'password', placeholder: '' },
            { key: 'logoUrl',  label: 'URL logo laborator (opțional)', type: 'url', placeholder: 'https://…' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
              <input
                type={f.type}
                required
                autoFocus={f.key === 'labName'}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Se creează contul…' : 'Creează cont'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Ai deja un cont?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Conectare
          </Link>
        </p>
      </div>
    </div>
  )
}
