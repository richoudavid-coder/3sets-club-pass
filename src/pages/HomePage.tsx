import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BrandHeader } from "../components/BrandHeader"
import { supabase } from "../lib/supabase"

export function HomePage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any[]>([])

  async function handleFindPass(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setResults([])
    if (!email.trim()) { setError("Merci de saisir ton adresse email."); return }
    setSearching(true)
    const { data } = await supabase
      .from("players")
      .select("id, first_name, last_name, sport, club:clubs(name)")
      .eq("email", email.trim().toLowerCase())
    if (!data || data.length === 0) {
      setError("Aucun compte trouve avec cet email. Verifie ton adresse ou inscris-toi via le QR code de ton club.")
    } else if (data.length === 1) {
      navigate("/pass/" + data[0].id)
    } else {
      setResults(data)
    }
    setSearching(false)
  }

  return (
    <div className="app-shell">
      <BrandHeader tagline="Coupons licencies clubs partenaires" />
      <div className="page-container">

        <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
          <img src="/logo-white.svg" alt="3SETS" style={{ height: 48, margin: "0 auto 16px", filter: "invert(1) sepia(1) saturate(2) hue-rotate(180deg)", display: "block" }} />
          <h1 style={{ fontSize: "1.5rem", marginBottom: 8 }}>3SETS Club Pass</h1>
          <p style={{ color: "var(--grey-text)", fontSize: "0.95rem" }}>
            Des avantages exclusifs reserves aux licencies des clubs partenaires 3SETS.
          </p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Retrouver mon pass</h2>
          <p style={{ color: "var(--grey-text)", fontSize: "0.85rem", marginBottom: 16 }}>
            Entre ton adresse email pour acceder a tes coupons.
          </p>
          <form onSubmit={handleFindPass}>
            {error ? <div className="form-error-banner">{error}</div> : null}
            <div className="field">
              <label>Ton adresse email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean.dupont@email.fr"
                autoComplete="email"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={searching}>
              {searching ? "Recherche en cours..." : "Retrouver mon pass"}
            </button>
          </form>

          {results.length > 1 ? (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: "0.85rem", color: "var(--grey-text)", marginBottom: 10 }}>
                Tu es inscrit dans plusieurs clubs — choisis lequel :
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {results.map((p) => (
                  <button
                    key={p.id}
                    className="btn btn-secondary"
                    onClick={() => navigate("/pass/" + p.id)}
                  >
                    {p.club?.name} — {p.first_name} {p.last_name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.82rem", color: "var(--grey-text)" }}>
          Pas encore inscrit ? Scanne le QR code affiche dans ton club partenaire.
        </p>

        <p style={{ textAlign: "center", marginTop: 8 }}>
          <Link to="/auth" style={{ fontSize: "0.78rem", color: "var(--grey-text)", fontWeight: 600 }}>
            Espace vendeur 3SETS
          </Link>
        </p>
      </div>
    </div>
  )
}
