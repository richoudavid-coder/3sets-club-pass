import { useState, useEffect, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { BrandHeader } from "../components/BrandHeader"
import { supabase } from "../lib/supabase"

export function NewPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true)
    })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null as string | null)
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caracteres."); return }
    if (password !== confirm) { setError("Les deux mots de passe ne correspondent pas."); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError("Une erreur est survenue. Reessaie.") }
    else {
      setSuccess(true)
      setTimeout(() => navigate("/auth"), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="app-shell">
      <BrandHeader tagline="Nouveau mot de passe" />
      <div className="page-container">
        <div className="card auth-card">
          <h2 style={{ marginBottom: 16, fontSize: "1.2rem" }}>Choisir un nouveau mot de passe</h2>
          {success ? (
            <div className="form-success-banner">
              Mot de passe modifie avec succes. Tu vas etre redirige vers la connexion...
            </div>
          ) : !ready ? (
            <div className="form-error-banner">
              Lien invalide ou expire. Redemande un lien de reinitialisation depuis la page de connexion.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error ? <div className="form-error-banner">{error}</div> : null as string | null}
              <div className="field">
                <label>Nouveau mot de passe</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Au moins 6 caracteres" autoComplete="new-password" />
              </div>
              <div className="field">
                <label>Confirmer le mot de passe</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repete le mot de passe" autoComplete="new-password" />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? "Modification en cours..." : "Enregistrer le nouveau mot de passe"}
              </button>
            </form>
          )}
          <p style={{ marginTop: 16, fontSize: "0.8rem", color: "var(--grey-text)", textAlign: "center" }}>
            <a href="/auth" style={{ color: "var(--navy)", fontWeight: 700 }}>Retour a la connexion</a>
          </p>
        </div>
      </div>
    </div>
  )
}
