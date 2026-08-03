import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { BrandHeader } from '../components/BrandHeader'
import { useAuth } from '../lib/AuthContext'

export function AuthPage() {
  const { session, isAdmin, signIn, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session && isAdmin) return <Navigate to="/admin" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: signInError } = await signIn(email.trim(), password)
    if (signInError) {
      setError(signInError)
      setSubmitting(false)
      return
    }
    navigate('/admin')
  }

  return (
    <div className="app-shell">
      <BrandHeader tagline="Espace vendeur 3SETS" />
      <div className="page-container">
        <div className="card auth-card">
          <h2 style={{ marginBottom: 16 }}>Connexion vendeur</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className="form-error-banner">{error}</div>}
            <div className="field">
              <label htmlFor="seller-email">Email</label>
              <input id="seller-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="field">
              <label htmlFor="seller-password">Mot de passe</label>
              <input id="seller-password" required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Connexion en cours…' : 'Se connecter'}
            </button>
          </form>
        </div>
        <p className="text-center" style={{ fontSize: '0.78rem', marginTop: 12 }}>
          <a href="/mot-de-passe-oublie" style={{ color: 'var(--navy)', fontWeight: 700 }}>Mot de passe oublié ?</a>
        </p>
      </div>
    </div>
  )
}
