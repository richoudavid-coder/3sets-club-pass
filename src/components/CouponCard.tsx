import type { CouponStatus } from "../types"
import { STATUS_LABELS, formatDateFr } from "../lib/coupons"

interface CouponCardProps {
  title: string
  description: string
  terms: string
  endDate: string
  status: CouponStatus
  index?: number
  sport?: string
}

function extractHighlight(title: string): { highlight: string; rest: string } {
  const patterns = [/^(-\d+\s*%)/i, /^(\d+\s*%)/i]
  for (const p of patterns) {
    const m = title.match(p)
    if (m) return { highlight: m[1], rest: title.slice(m[1].length).trim() }
  }
  return { highlight: "", rest: title }
}

export function CouponCard({ title, description, terms, endDate, status, index, sport }: CouponCardProps) {
  const { highlight, rest } = extractHighlight(title)
  const num = index !== undefined ? String(index + 1).padStart(2, "0") : null

  const sportLabel = sport ? {
    tennis: "TENNIS",
    badminton: "BADMINTON",
    padel: "PADEL",
    "tennis-de-table": "TENNIS DE TABLE",
    pickleball: "PICKLEBALL",
  }[sport] || sport.toUpperCase() : null

  const sportColor = sport ? {
    tennis: "#0a1f44",
    badminton: "#1ea672",
    padel: "#ff7a1a",
    "tennis-de-table": "#d7263d",
    pickleball: "#7c3aed",
  }[sport] || "#0a1f44" : "#ff7a1a"

  return (
    <div className={"cpv2-card cpv2-card--" + status} style={{ position: "relative", overflow: "hidden" }}>
      {sportLabel ? (
        <div style={{
          position: "absolute",
          left: -28,
          top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          background: sportColor,
          color: "white",
          fontSize: "0.55rem",
          fontWeight: 900,
          letterSpacing: "0.15em",
          padding: "3px 20px",
          whiteSpace: "nowrap",
          zIndex: 2,
          fontFamily: "var(--font-display)",
        }}>
          {sportLabel}
        </div>
      ) : null}
      <div className="cpv2-card__top" style={{ paddingLeft: sport ? 24 : undefined }}>
        <div className="cpv2-card__left">
          {highlight ? (
            <>
              <div className="cpv2-card__highlight">{highlight}</div>
              <div className="cpv2-card__title">{rest}</div>
            </>
          ) : (
            <div className="cpv2-card__title cpv2-card__title--full">{title}</div>
          )}
          <p className="cpv2-card__desc">{description}</p>
        </div>
        {num ? <span className="cpv2-card__num">{num}</span> : null}
      </div>
      <div className="cpv2-card__divider" />
      <div className="cpv2-card__bottom">
        <div className="cpv2-card__meta">
          <span className="cpv2-card__terms">{terms}</span>
          <span className="cpv2-card__date">Valable jusqu au {formatDateFr(endDate)}</span>
        </div>
        <span className={"cpv2-status cpv2-status--" + status}>{STATUS_LABELS[status]}</span>
      </div>
    </div>
  )
}
