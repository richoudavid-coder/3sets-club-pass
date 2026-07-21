import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

const COLOR_STYLES: Record<string, { bg: string; color: string }> = {
  orange: { bg: "#ff7a1a", color: "white" },
  navy: { bg: "#0a1f44", color: "white" },
  green: { bg: "#1ea672", color: "white" },
  red: { bg: "#d7263d", color: "white" },
  purple: { bg: "#7c3aed", color: "white" },
}

export function NotificationBanner() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split("T")[0]
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("active", true)
        .gte("end_date", today)
        .order("created_at", { ascending: false })
      setNotifications(data || [])
    }
    load()
  }, [])

  if (notifications.length === 0) return null

  const notif = notifications[current]
  const style = COLOR_STYLES[notif.color] || COLOR_STYLES.orange
  const isClickable = notif.description || notif.coupon_id

  // Apres fermeture : afficher un petit bouton raccourci pour chaque notif
  if (dismissed) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0" }}>
        {notifications.map((n) => {
          const s = COLOR_STYLES[n.color] || COLOR_STYLES.orange
          return (
            <button
              key={n.id}
              onClick={() => navigate("/offre/" + n.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: s.bg,
                color: s.color,
                border: "none",
                borderRadius: 12,
                padding: "12px 16px",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}
            >
              {n.image_url ? (
                <img src={n.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 8, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>
                  🎾
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Bebas Neue, var(--font-display)", fontSize: "1.1rem", letterSpacing: "0.04em", lineHeight: 1.1 }}>
                  {n.title}
                </div>
                <div style={{ fontSize: "0.75rem", opacity: 0.85, marginTop: 2 }}>
                  {n.message.length > 50 ? n.message.slice(0, 50) + "..." : n.message}
                </div>
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.8, flexShrink: 0 }}>
                Voir →
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,31,68,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 100,
      }}
      onClick={() => setDismissed(true)}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          overflow: "hidden",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {notif.image_url ? (
          <img
            src={notif.image_url}
            alt={notif.title}
            style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block", cursor: isClickable ? "pointer" : "default" }}
            onClick={() => { if (isClickable) { setDismissed(true); navigate("/offre/" + notif.id) } }}
          />
        ) : null}

        <div
          style={{ background: style.bg, padding: "16px 20px", cursor: isClickable ? "pointer" : "default" }}
          onClick={() => { if (isClickable) { setDismissed(true); navigate("/offre/" + notif.id) } }}
        >
          <div style={{ fontFamily: "Bebas Neue, var(--font-display)", fontSize: "1.6rem", letterSpacing: "0.04em", color: style.color, lineHeight: 1.1, marginBottom: 6 }}>
            {notif.title}
          </div>
          <div style={{ fontSize: "0.92rem", color: style.color, opacity: 0.92, lineHeight: 1.4 }}>
            {notif.message}
          </div>
          {isClickable ? (
            <div style={{ marginTop: 10, fontSize: "0.78rem", color: style.color, opacity: 0.8, fontWeight: 700 }}>
              Appuie pour voir le détail et le coupon associé →
            </div>
          ) : null}
        </div>

        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f4f6f8", gap: 10 }}>
          {notifications.length > 1 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setCurrent((current - 1 + notifications.length) % notifications.length)}
                style={{ background: "var(--grey-line)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ←
              </button>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)" }}>
                {current + 1} / {notifications.length}
              </span>
              <button
                onClick={() => setCurrent((current + 1) % notifications.length)}
                style={{ background: "var(--grey-line)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                →
              </button>
            </div>
          ) : <div />}
          <button
            onClick={() => setDismissed(true)}
            style={{ background: "var(--navy)", color: "white", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
