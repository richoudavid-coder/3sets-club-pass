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
  const [dismissed, setDismissed] = useState<string[]>([])

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

  const visible = notifications.filter((n) => !dismissed.includes(n.id))

  if (visible.length === 0) return null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "16px 0" }}>
      {visible.map((notif) => {
        const style = COLOR_STYLES[notif.color] || COLOR_STYLES.orange
        return (
          <div key={notif.id} style={{
            background: style.bg,
            color: style.color,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            position: "relative",
          }}>
            {notif.image_url ? (
              <img src={notif.image_url} alt={notif.title} style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }} />
            ) : null}
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontFamily: "Bebas Neue, var(--font-display)", fontSize: "1.3rem", letterSpacing: "0.04em", marginBottom: 4 }}>
                  {notif.title}
                </div>
                <button
                  onClick={() => setDismissed((prev) => [...prev, notif.id])}
                  style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", fontSize: "1rem", lineHeight: 1, flexShrink: 0, marginLeft: 8 }}
                >
                  x
                </button>
              </div>
              <div style={{ fontSize: "0.88rem", opacity: 0.9, lineHeight: 1.4 }}>{notif.message}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
