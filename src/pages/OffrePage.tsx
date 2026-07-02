import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { BrandHeader } from "../components/BrandHeader"
import { Loader } from "../components/Loader"
import { CouponCard } from "../components/CouponCard"
import { supabase } from "../lib/supabase"
import { computeDisplayStatus } from "../lib/coupons"

const COLOR_STYLES: Record<string, { bg: string; color: string }> = {
  orange: { bg: "#ff7a1a", color: "white" },
  navy: { bg: "#0a1f44", color: "white" },
  green: { bg: "#1ea672", color: "white" },
  red: { bg: "#d7263d", color: "white" },
  purple: { bg: "#7c3aed", color: "white" },
}

export function OffrePage() {
  const { notifId } = useParams<{ notifId: string }>()
  const [notif, setNotif] = useState<any>(null)
  const [coupon, setCoupon] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!notifId) return
      const { data } = await supabase
        .from("notifications")
        .select("*, coupon:coupons(*)")
        .eq("id", notifId)
        .maybeSingle()
      if (data) {
        setNotif(data)
        if (data.coupon) setCoupon(data.coupon)
      }
      setLoading(false)
    }
    load()
  }, [notifId])

  if (loading) return (
    <div className="app-shell">
      <BrandHeader tagline="Offre speciale" />
      <div className="page-container"><Loader label="Chargement de l offre..." /></div>
    </div>
  )

  if (!notif) return (
    <div className="app-shell">
      <BrandHeader tagline="Offre speciale" />
      <div className="page-container text-center" style={{ paddingTop: 50 }}>
        <h2>Offre introuvable</h2>
        <Link to="/" className="btn btn-secondary mt-24" style={{ display: "inline-flex" }}>Retour</Link>
      </div>
    </div>
  )

  const style = COLOR_STYLES[notif.color] || COLOR_STYLES.orange

  return (
    <div className="app-shell">
      <BrandHeader tagline="Offre speciale 3SETS" />
      <div className="page-container">

        <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", marginTop: 24, marginBottom: 20 }}>
          {notif.image_url ? (
            <img src={notif.image_url} alt={notif.title} style={{ width: "100%", maxHeight: 280, objectFit: "cover", display: "block" }} />
          ) : null}
          <div style={{ background: style.bg, padding: "20px 20px 16px" }}>
            <div style={{ fontFamily: "Bebas Neue, var(--font-display)", fontSize: "2rem", color: style.color, letterSpacing: "0.04em", lineHeight: 1.1, marginBottom: 8 }}>
              {notif.title}
            </div>
            <div style={{ fontSize: "0.95rem", color: style.color, opacity: 0.92, lineHeight: 1.5 }}>
              {notif.message}
            </div>
          </div>
          {notif.description ? (
            <div style={{ background: "white", padding: "16px 20px", fontSize: "0.92rem", color: "var(--navy-soft)", lineHeight: 1.6, borderTop: "1px solid var(--grey-line)" }}>
              {notif.description}
            </div>
          ) : null}
        </div>

        {coupon ? (
          <>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 14, color: "var(--navy)" }}>
              Coupon associe a cette offre
            </h3>
            <CouponCard
              title={coupon.title}
              description={coupon.description}
              terms={coupon.terms}
              endDate={coupon.end_date}
              status={computeDisplayStatus("available", coupon.end_date)}
              sport={coupon.sport}
            />
            <p style={{ fontSize: "0.8rem", color: "var(--grey-text)", marginTop: 10, textAlign: "center" }}>
              Presente ton pass en magasin pour faire valider ce coupon par un vendeur 3SETS.
            </p>
          </>
        ) : null}

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link to={-1 as any} className="btn btn-secondary">
            Retour
          </Link>
        </div>
      </div>
    </div>
  )
}
