import { useEffect, useState } from "react"
import { useParams, Link, useSearchParams } from "react-router-dom"
import { BrandHeader } from "../components/BrandHeader"
import { Loader } from "../components/Loader"
import { CouponCard } from "../components/CouponCard"
import { NotificationBanner } from "../components/NotificationBanner"
import { usePushNotifications } from "../lib/usePushNotifications"
import { supabase, isSupabaseConfigured } from "../lib/supabase"
import { computeDisplayStatus } from "../lib/coupons"
import { SPORT_LABELS } from "../types"

export function PlayerPassPage() {
  const { playerId: passToken } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [player, setPlayer] = useState<any>(null)
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showNotificationSetup, setShowNotificationSetup] = useState(searchParams.get("new") === "1")
  const { permission, subscribed, busy, error: pushError, isIos, isStandalone, supported, subscribe } = usePushNotifications(passToken)

  function closeNotificationSetup() {
    setShowNotificationSetup(false)
    if (searchParams.has("new")) {
      const next = new URLSearchParams(searchParams)
      next.delete("new")
      setSearchParams(next, { replace: true })
    }
  }

  async function activateNotifications() {
    if (await subscribe()) closeNotificationSetup()
  }

  useEffect(() => {
    if (!passToken) return
    async function load() {
      setLoading(true)
      if (!isSupabaseConfigured) { setNotFound(true); setLoading(false); return }
      const { data, error: passError } = await supabase.rpc("get_player_pass", { p_pass_token: passToken })
      if (passError || !data?.player) { setNotFound(true); setLoading(false); return }
      setPlayer(data.player)
      setCoupons((data.coupons || []).map((coupon: any) => ({
        ...coupon, status: computeDisplayStatus(coupon.status, coupon.endDate),
      })))
      setLoading(false)
    }
    load()
  }, [passToken])

  if (loading) return (
    <div className="app-shell">
      <BrandHeader tagline="Mon pass 3SETS" />
      <div className="page-container"><Loader label="Chargement de ton pass..." /></div>
    </div>
  )

  if (notFound || !player) return (
    <div className="app-shell">
      <BrandHeader tagline="Mon pass 3SETS" />
      <div className="page-container text-center" style={{ paddingTop: 50 }}>
        <h2>Pass introuvable</h2>
        <p style={{ color: "var(--grey-text)", marginTop: 10 }}>
          Ce pass n existe pas ou plus. Contacte le magasin 3SETS.
        </p>
        <Link to="/" className="btn btn-secondary mt-24" style={{ display: "inline-flex" }}>Retour</Link>
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <BrandHeader tagline="Mon pass 3SETS" />
      <div className="page-container">
        {!showNotificationSetup ? <NotificationBanner /> : null}
        <div className="pass-greeting">
          <h1>Bonjour {player.first_name}</h1>
          <div className="pass-greeting__meta">
            <span className="pass-greeting__tag">{player.club?.name ?? "Club"}</span>
            {(player.club?.sports && player.club.sports.length > 0
              ? player.club.sports
              : [player.sport]
            ).map((s: string) => (
              <span key={s} className="pass-greeting__tag">
                {SPORT_LABELS[s as keyof typeof SPORT_LABELS] || s}
              </span>
            ))}
          </div>
        </div>
        <p style={{ color: "var(--grey-text)", fontSize: "0.88rem", marginTop: 4 }}>
          Présente cet écran en magasin pour faire valider tes coupons par un vendeur 3SETS.
        </p>
        {!subscribed ? (
          <div style={{ background: "var(--navy)", borderRadius: 12, padding: "14px 16px", marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: "0.88rem", marginBottom: 3 }}>
                {isIos && !isStandalone ? "Installer le Club Pass" : "Activer les notifications"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>
                {isIos && !isStandalone
                  ? "Sur iPhone : Partager → Sur l’écran d’accueil, puis ouvre l’icône 3SETS."
                  : "Sois alerté des nouvelles offres 3SETS en temps réel."}
              </div>
              {pushError ? <div style={{ color: "#ffd2d2", fontSize: "0.74rem", marginTop: 6 }}>{pushError}</div> : null}
            </div>
            {!(isIos && !isStandalone) ? <button
              onClick={activateNotifications}
              disabled={busy || !supported}
              style={{ background: "var(--orange)", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {busy ? "Activation…" : permission === "granted" ? "Finaliser" : "Activer"}
            </button> : null}
          </div>
        ) : null}
        {subscribed ? (
          <div style={{ background: "var(--success-bg)", borderRadius: 12, padding: "10px 16px", marginTop: 12, fontSize: "0.78rem", color: "var(--success)", fontWeight: 600 }}>
            Notifications activées — tu seras alerté des nouvelles offres
          </div>
        ) : null}
        <div className="coupons-grid">
          {coupons.length === 0 && (
            <div className="empty-state">Aucun coupon disponible pour le moment.</div>
          )}
          {coupons.map((c, i) => (
            <CouponCard
              key={c.playerCouponId}
              index={i}
              title={c.title}
              description={c.description}
              terms={c.terms}
              endDate={c.endDate}
              status={c.status}
              sport={c.sport}
            />
          ))}
        </div>
        {showNotificationSetup ? (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,31,68,0.78)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "white", width: "100%", maxWidth: 420, borderRadius: 18, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>🔔</div>
              <h2 style={{ marginBottom: 10 }}>Ne rate aucune offre 3SETS</h2>
              {isIos && !isStandalone ? (
                <>
                  <p style={{ color: "var(--grey-text)", lineHeight: 1.5 }}>Pour recevoir les notifications sur ton iPhone :</p>
                  <ol style={{ margin: "14px 0 18px", paddingLeft: 22, lineHeight: 1.8, color: "var(--navy)" }}>
                    <li>Appuie sur le bouton <strong>Partager</strong> de Safari.</li>
                    <li>Choisis <strong>Sur l’écran d’accueil</strong>.</li>
                    <li>Ouvre ensuite le Club Pass depuis l’icône 3SETS.</li>
                    <li>Appuie sur <strong>Activer les notifications</strong>.</li>
                  </ol>
                  <button className="btn btn-secondary btn-block" onClick={closeNotificationSetup}>J’ai compris</button>
                </>
              ) : (
                <>
                  <p style={{ color: "var(--grey-text)", lineHeight: 1.5, marginBottom: 16 }}>Autorise les notifications pour recevoir les nouvelles offres directement sur ton téléphone.</p>
                  {pushError ? <div className="form-error-banner">{pushError}</div> : null}
                  <button className="btn btn-primary btn-block" onClick={activateNotifications} disabled={busy || !supported}>
                    {busy ? "Activation en cours…" : "Activer les notifications"}
                  </button>
                  <button className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={closeNotificationSetup}>Plus tard</button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
