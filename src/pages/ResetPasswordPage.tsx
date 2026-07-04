import { useState, type FormEvent } from "react"
import { BrandHeader } from "../components/BrandHeader"
import { supabase } from "../lib/supabase"

export function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim()) { setError("Merci de saisir ton adresse email."); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + "/nouveau-mot-de-passe",
    })
    if (err) { setError("Erreur: " + JSON.stringify(err)) }
    else { setSent(true) }
    setLoading(false)
  }

  return (
    <div className="app-shell">
      <BrandHeader tagline="Réinitialisation du mot de passe" />
      <div className="page-container">
        <div className="card auth-card">
          <h2 style={{ marginBottom: 16, fontSize: "1.2rem" }}>Mot de passe oublié</h2>
          {sent ? (
            <div className="form-succèss-banner">
              Un email de réinitialisation a ete envoye a {email}. Vérifie ta boite mail et clique sur le lien pour choisir un nouveau mot de passe.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error ? <div className="form-error-banner">{error}</div> : null}
              <div className="field">
                <label>Adresse email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.fr" autoComplete="email" />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
              </button>
            </form>
          )}
          <p style={{ marginTop: 16, fontSize: "0.8rem", color: "var(--grey-text)", textAlign: "center" }}>
            <a href="/auth" style={{ color: "var(--navy)", fontWeight: 700 }}>Retour à la connexion</a>
          </p>
        </div>
      </div>
    </div>
  )
}
