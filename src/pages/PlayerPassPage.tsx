import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { BrandHeader } from "../components/BrandHeader"
import { Loader } from "../components/Loader"
import { CouponCard } from "../components/CouponCard"
import { NotificationBanner } from "../components/NotificationBanner"
import { usePushNotifications } from "../lib/usePushNotifications"
import { supabase, isSupabaseConfigured } from "../lib/supabase"
import { computeDisplayStatus } from "../lib/coupons"
import { SPORT_LABELS } from "../types"

export function PlayerPassPage() {
  const { playerId } = useParams()
  const [player, setPlayer] = useState<any>(null)
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const { permission, subscribed, subscribe } = usePushNotifications(playerId)

  useEffect(() => {
    if (!playerId) return
    async function load() {
      setLoading(true)
      if (!isSupabaseConfigured) { setNotFound(true); setLoading(false); return }
      const { data: playerData, error: playerError } = await supabase
        .from("players").select("*, club:clubs(*)").eq("id", playerId).maybeSingle()
      if (playerError || !playerData) { setNotFound(true); setLoading(false); return }
      setPlayer(playerData)

      const { data: pcData } = await supabase
        .from("player_coupons")
        .select("id, status, used_at, coupon_id")
        .eq("player_id", playerId)
        .order("created_at", { ascending: true })

      const couponIds = (pcData || []).map((pc) => pc.coupon_id)

      const { data: couponsData } = couponIds.length > 0
        ? await supabase.from("coupons").select("*").in("id", couponIds).eq("active", true)
        : { data: [] }

      const couponsMap = new Map((couponsData || []).map((c) => [c.id, c]))

      const views = (pcData || [])
        .filter((pc) => couponsMap.has(pc.coupon_id))
        .map((pc) => {
          const coupon = couponsMap.get(pc.coupon_id)
          return {
            playerCouponId: pc.id,
            title: coupon.title,
            description: coupon.description,
            terms: coupon.terms,
            endDate: coupon.end_date,
            sport: coupon.sport,
            status: computeDisplayStatus(pc.status, coupon.end_date),
            usedAt: pc.used_at,
          }
        })

      setCoupons(views)
      setLoading(false)
    }
    load()
  }, [playerId])

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
        <NotificationBanner />
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
        {permission === "default" && !subscribed ? (
          <div style={{ background: "var(--navy)", borderRadius: 12, padding: "14px 16px", marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: "0.88rem", marginBottom: 3 }}>
                Activer les notifications
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>
                Sois alerté des nouvelles offres 3SETS en temps réel
              </div>
            </div>
            <button
              onClick={subscribe}
              style={{ background: "var(--orange)", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Activer
            </button>
          </div>
        ) : null}
        {permission === "granted" || subscribed ? (
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
      </div>
    </div>
  )
}
