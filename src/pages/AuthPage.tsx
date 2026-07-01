import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { BrandHeader } from '../components/BrandHeader'
import { useAuth } from '../lib/AuthContext'

export function AuthPage() {
  const { session, isAdmin, signIn, signUp, loading } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    if (mode === 'login') {
      const { error: signInError } = await signIn(email.trim(), password)
      if (signInError) {
        setError(signInError)
        setSubmitting(false)
        return
      }
      navigate('/admin')
    } else {
      const { error: signUpError } = await signUp(email.trim(), password)
      if (signUpError) {
        setError(signUpError)
        setSubmitting(false)
        return
      }
      setInfo(
        'Compte créé. Si la confirmation par email est activée sur ton projet Supabase, vérifie ta boîte mail avant de te connecter.'
      )
      setMode('login')
      setSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <BrandHeader tagline="Espace vendeur 3SETS" />
      <div className="page-container">
        <div className="card auth-card">
          <div className="auth-tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
              Connexion
            </button>
            <button
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => setMode('signup')}
            >
              Créer un compte
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="form-error-banner">{error}</div>}
            {info && <div className="form-success-banner">{info}</div>}

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="magasin@3sets.fr"
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting
                ? 'Connexion en cours…'
                : mode === 'login'
                  ? 'Se connecter'
                  : 'Créer le compte'}
            </button>
          </form>
        </div>

        <p className="text-center" style={{ fontSize: '0.78rem', color: 'var(--grey-text)', marginTop: 12 }}><a href="/mot-de-passe-oublie" style={{ color: 'var(--navy)', fontWeight: 700 }}>Mot de passe oublie ?</a></p><p className="text-center" style={{ fontSize: '0.78rem', color: 'var(--grey-text)', marginTop: 8 }}>
          Le compte magasin@3sets.fr devient automatiquement administrateur à sa création (voir le
          script SQL fourni).
        </p>
      </div>
    </div>
  )
}
