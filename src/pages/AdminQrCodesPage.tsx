import { useEffect, useRef, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { AdminLayout } from "./AdminLayout"
import { Loader } from "../components/Loader"
import { supabase } from "../lib/supabase"
import { APP_URL } from "../lib/supabase"
import { SPORT_LABELS } from "../types"

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ")
  let line = ""
  let curY = y
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " "
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, curY)
      line = words[n] + " "
      curY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, curY)
}

export function AdminQrCodesPage() {
  const [clubs, setClubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const wrapRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("clubs").select("*")
        .order("sport", { ascending: true })
        .order("name", { ascending: true })
      setClubs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  function buildUrl(slug: string) {
    return APP_URL.replace(/\/$/, "") + "/club/" + slug
  }

  function handleDownload(slug: string, clubName: string, sportLabel: string) {
    const qrCanvas = wrapRefs.current[slug]?.querySelector("canvas")
    if (!qrCanvas) return

    const cardCanvas = document.createElement("canvas")
    const W = 360
    const H = 480
    cardCanvas.width = W
    cardCanvas.height = H
    const ctx = cardCanvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = "#e1e6ea"
    ctx.lineWidth = 1.5
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1)

    ctx.fillStyle = "#e8650a"
    ctx.font = "700 12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(sportLabel.toUpperCase(), W / 2, 28)

    ctx.fillStyle = "#0a1f44"
    ctx.font = "800 19px Arial"
    wrapText(ctx, clubName, W / 2, 55, W - 40, 24)

    const qrSize = 160
    const qrX = (W - qrSize) / 2
    const qrY = 110
    ctx.fillStyle = "#ffffff"
    ctx.strokeStyle = "#e1e6ea"
    ctx.lineWidth = 1.5
    ctx.strokeRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28)
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize)

    ctx.fillStyle = "#8a93a1"
    ctx.font = "600 11px Arial"
    ctx.fillText(APP_URL.replace(/^https?:\/\//, "") + "/club/" + slug, W / 2, qrY + qrSize + 46)

    ctx.fillStyle = "#ff7a1a"
    ctx.fillRect(0, H - 6, W, 6)

    const url = cardCanvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.href = url
    link.download = "fiche-qrcode-" + slug + ".png"
    link.click()
  }

  if (loading) {
    return (
      <AdminLayout>
        <Loader label="Chargement des clubs..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <h1>QR codes clubs</h1>
      </div>

      <p style={{ color: "var(--grey-text)", marginBottom: 20, fontSize: "0.9rem" }}>
        Imprime ces QR codes et affiche-les dans chaque club partenaire. Une fois scannes, ils
        amenent directement le joueur sur sa page d inscription, club et sport deja
        pre-remplis. Pour ajouter, desactiver ou supprimer un club, va dans{" "}
        <a href="/admin/clubs" style={{ color: "var(--navy)", fontWeight: 700 }}>
          Gestion des clubs
        </a>
        .
      </p>

      <div className="qr-grid">
        {clubs.map((club) => {
          const url = buildUrl(club.slug)
          return (
            <div className="qr-card" key={club.id}>
              <div className="qr-card__sport">{SPORT_LABELS[club.sport as keyof typeof SPORT_LABELS]}</div>
              <div className="qr-card__name">{club.name}</div>
              <div
                className="qr-card__canvas-wrap"
                ref={(el) => {
                  wrapRefs.current[club.slug] = el
                }}
              >
                <QRCodeCanvas value={url} size={160} level="M" />
              </div>
              <div className="qr-card__url">{url}</div>
              <button
                className="btn btn-secondary btn-sm btn-block"
                onClick={() => handleDownload(club.slug, club.name, SPORT_LABELS[club.sport as keyof typeof SPORT_LABELS] || club.sport)}
              >
                Telecharger la fiche PNG
              </button>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
