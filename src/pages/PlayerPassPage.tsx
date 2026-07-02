import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { BrandHeader } from "../components/BrandHeader"
import { Loader } from "../components/Loader"
import { CouponCard } from "../components/CouponCard"
import { supabase, isSupabaseConfigured } from "../lib/supabase"
import { computeDisplayStatus } from "../lib/coupons"
import { SPORT_LABELS, type Player, type PlayerCouponView, type Club } from "../types"

export function PlayerPassPage() {
  const { playerId } = useParams()
  const [player, setPlayer] = useState<any>(null)
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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
          Ce pass n'existe pas ou plus. Contacte le magasin 3SETS.
        </p>
        <Link to="/" className="btn btn-secondary mt-24" style={{ display: "inline-flex" }}>Retour</Link>
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <BrandHeader tagline="Mon pass 3SETS" />
      <div className="page-container">
        <div className="pass-greeting">
          <h1>Bonjour {player.first_name}</h1>
          <div className="pass-greeting__meta">
            <span className="pass-greeting__tag">{player.club?.name ?? "Club"}</span>
            <span className="pass-greeting__tag">{SPORT_LABELS[player.sport]}</span>
          </div>
        </div>
        <p style={{ color: "var(--grey-text)", fontSize: "0.88rem", marginTop: 4 }}>
          Presente cet ecran en magasin pour faire valider tes coupons par un vendeur 3SETS.
        </p>
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
            />
          ))}
        </div>
      </div>
    </div>
  )
}
