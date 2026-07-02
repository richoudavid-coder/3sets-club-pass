import { useEffect, useState } from "react"
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

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split("T")[0]
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false })
      setNotifications(data || [])
    }
    load()
  }, [])

  if (dismissed || notifications.length === 0) return null

  const notif = notifications[current]
  const style = COLOR_STYLES[notif.color] || COLOR_STYLES.orange

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
          animation: "fadeInUp 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {notif.image_url ? (
          <img
            src={notif.image_url}
            alt={notif.title}
            style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }}
          />
        ) : null}

        <div style={{ background: style.bg, padding: "16px 20px" }}>
          <div style={{
            fontFamily: "Bebas Neue, var(--font-display)",
            fontSize: "1.6rem",
            letterSpacing: "0.04em",
            color: style.color,
            lineHeight: 1.1,
            marginBottom: 6,
          }}>
            {notif.title}
          </div>
          <div style={{ fontSize: "0.92rem", color: style.color, opacity: 0.92, lineHeight: 1.4 }}>
            {notif.message}
          </div>
        </div>

        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f4f6f8" }}>
          {notifications.length > 1 ? (
            <div style={{ display: "flex", gap: 6 }}>
              {notifications.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  style={{
                    width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer",
                    background: i === current ? "var(--orange)" : "var(--grey-line)",
                  }}
                />
              ))}
            </div>
          ) : <div />}
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: "var(--navy)",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "8px 20px",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
