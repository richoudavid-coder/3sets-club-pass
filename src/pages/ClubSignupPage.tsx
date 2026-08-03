import { useEffect, useState, type FormEvent } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { BrandHeader } from "../components/BrandHeader"
import { Loader } from "../components/Loader"
import { supabase, isSupabaseConfigured } from "../lib/supabase"
import { SPORT_LABELS, type Club } from "../types"

export function ClubSignupPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [club, setClub] = useState<any>(null)
  const [loadingClub, setLoadingClub] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [newsletter, setNewsletter] = useState(false)
  const [tab, setTab] = useState("new")
  const [existingEmail, setExistingEmail] = useState("")
  const [existingPhone, setExistingPhone] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    async function loadClub() {
      setLoadingClub(true)
      if (!isSupabaseConfigured) { setNotFound(true); setLoadingClub(false); return }
      const { data, error: fetchError } = await supabase
        .from("clubs").select("*").eq("slug", slug).eq("active", true).maybeSingle()
      if (fetchError || !data) { setNotFound(true) } else { setClub(data) }
      setLoadingClub(false)
    }
    loadClub()
  }, [slug])

  async function handleFindPass(e: any) {
    e.preventDefault()
    setSearchError(null)
    if (!existingEmail.trim() || !existingPhone.trim() || !club) return
    setSearching(true)
    const { data, error: findError } = await supabase.rpc("find_player_passes", {
      p_email: existingEmail.trim().toLowerCase(), p_phone: existingPhone.trim(),
    })
    const match = (data || []).find((p: any) => p.club_name === club.name)
    if (!findError && match) {
      navigate("/pass/" + match.pass_token)
    } else {
      setSearchError("Aucun compte trouvé avec cet email pour ce club. Vérifie ton adresse ou inscris-toi.")
    }
    setSearching(false)
  }

  async function handleSubmit(e: any) {
    e.preventDefault()
    if (!club) return
    setError(null)

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError("Merci de remplir tous les champs.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError("Merci de saisir une adresse email validé.")
      return
    }

    setSubmitting(true)

    try {
      const digits = phone.replace(/\D/g, "")
      if (digits.length < 10 || digits.length > 15) {
        setError("Merci de saisir un numéro de téléphone valide.")
        setSubmitting(false)
        return
      }
      const { data: passToken, error: registerError } = await supabase.rpc("register_player", {
        p_club_slug: slug, p_first_name: firstName.trim(), p_last_name: lastName.trim(),
        p_email: email.trim().toLowerCase(), p_phone: phone.trim(), p_newsletter: newsletter,
      })
      if (registerError || !passToken) {
        const knownAccount = registerError?.message?.includes("ACCOUNT_EXISTS")
        setError(knownAccount
          ? "Un compte utilisant cet email ou ce téléphone existe déjà. Utilise l’onglet Déjà inscrit avec ton email et ton téléphone."
          : "L’inscription n’a pas pu être enregistrée. Vérifie les informations puis réessaie.")
        setSubmitting(false)
        return
      }
      navigate("/pass/" + passToken + "?new=1")
    } catch (err) {
      setError("Une erreur inattendue est survenue.")
      setSubmitting(false)
    }
  }

  if (loadingClub) return (
    <div className="app-shell">
      <BrandHeader tagline="Inscription club partenaire" />
      <div className="page-container"><Loader label="Chargement du club..." /></div>
    </div>
  )

  if (notFound || !club) return (
    <div className="app-shell">
      <BrandHeader tagline="Inscription club partenaire" />
      <div className="page-container text-center" style={{ paddingTop: 50 }}>
        <h2>Club introuvable</h2>
        <p style={{ color: "var(--grey-text)", marginTop: 10 }}>
          Le lien scanné ne correspond a aucun club partenaire actif.
        </p>
        <Link to="/" className="btn btn-secondary mt-24" style={{ display: "inline-flex" }}>Retour</Link>
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <BrandHeader tagline="Inscription club partenaire" />
      <div className="page-container">
        <div className="club-hero">
          <span className="club-hero__sport-chip">{SPORT_LABELS[club.sport as keyof typeof SPORT_LABELS]}</span>
          <h1>{club.name}</h1>
          <p>Inscris-toi pour débloquer tes coupons 3SETS réservés aux licenciés de ton club.</p>
        </div>
        <div className="auth-tabs" style={{ marginBottom: 0, borderRadius: "14px 14px 0 0" }}>
          <button className={tab === "new" ? "active" : ""} onClick={() => setTab("new")}>
            Nouveau
          </button>
          <button className={tab === "existing" ? "active" : ""} onClick={() => setTab("existing")}>
            Déjà inscrit
          </button>
        </div>
        <div className="card" style={{ borderRadius: "0 0 14px 14px", marginTop: 0 }}>
          {tab === "existing" ? (
            <form onSubmit={handleFindPass}>
              <p style={{ color: "var(--grey-text)", fontSize: "0.88rem", marginBottom: 16 }}>
                Entre ton adresse email pour retrouver ton pass et tes coupons.
              </p>
              {searchError ? <div className="form-error-banner">{searchError}</div> : null}
              <div className="field">
                <label>Ton adresse email</label>
                <input
                  type="email"
                  value={existingEmail}
                  onChange={(e) => setExistingEmail(e.target.value)}
                  placeholder="jean.dupont@email.fr"
                  autoComplete="email"
                />
              </div>
              <div className="field">
                <label>Ton numéro de téléphone</label>
                <input type="tel" value={existingPhone} onChange={(e) => setExistingPhone(e.target.value)} autoComplete="tel" required />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={searching}>
                {searching ? "Recherche en cours......" : "Retrouver mon pass"}
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit}>
            {error ? <div className="form-error-banner">{error}</div> : null}
            <div className="field">
              <label>Club</label>
              <input value={club.name} disabled className="field-locked" />
            </div>
            <div className="field">
              <label>Sport</label>
              <input value={SPORT_LABELS[club.sport as keyof typeof SPORT_LABELS]} disabled className="field-locked" />
            </div>
            <div className="field">
              <label>Prénom</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jean" autoComplete="given-name" />
            </div>
            <div className="field">
              <label>Nom</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dupont" autoComplete="family-name" />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jean.dupont@email.fr" autoComplete="email" />
            </div>
            <div className="field">
              <label>Téléphone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" autoComplete="tel" />
            </div>
            <div className="field" style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
              <input
                type="checkbox"
                id="newsletter"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: "var(--orange)", flexShrink: 0 }}
              />
              <label htmlFor="newsletter" style={{ fontSize: "0.88rem", color: "var(--navy-soft)", cursor: "pointer", fontWeight: 400 }}>
                J'accepte de recevoir les offres exclusives et la newsletter 3SETS par email. Tu pourras te désabonner à tout moment.
              </label>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Inscription en cours..." : "Je m'inscris et je récupère mes coupons"}
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  )
}
