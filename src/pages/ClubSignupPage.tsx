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
  const [newsletter, setNewsletter] = useState(true)

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
      setError("Merci de saisir une adresse email valide.")
      return
    }

    setSubmitting(true)

    try {
      const { data: existing } = await supabase
        .from("players").select("id").eq("club_id", club.id)
        .eq("email", email.trim().toLowerCase()).maybeSingle()

      if (existing) { navigate("/pass/" + existing.id); return }

      const { data: player, error: insertError } = await supabase
        .from("players").insert({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          sport: club.sport,
          club_id: club.id,
          newsletter: newsletter,
        }).select().single()

      if (insertError || !player) {
        setError("Une erreur est survenue lors de l inscription. Reessaie dans un instant.")
        setSubmitting(false)
        return
      }

      const { data: matchingCoupons } = await supabase
        .from("coupons").select("id").eq("sport", club.sport).eq("active", true)
        .or("club_id.is.null,club_id.eq." + club.id)

      if (matchingCoupons && matchingCoupons.length > 0) {
        const rows = matchingCoupons.map((c) => ({
          player_id: player.id,
          coupon_id: c.id,
          status: "available",
        }))
        await supabase.from("player_coupons").insert(rows)
      }

      navigate("/pass/" + player.id)
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
          <p>Inscris-toi pour debloquer tes coupons 3SETS reserves aux licencies de ton club.</p>
        </div>
        <div className="card">
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
              <label>Prenom</label>
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
              <label>Telephone</label>
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
                J accepte de recevoir les offres exclusives et la newsletter 3SETS par email. Tu pourras te desabonner a tout moment.
              </label>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Inscription en cours..." : "Je m inscris et je recupere mes coupons"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
