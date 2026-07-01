import type { CouponStatus } from "../types"
import { STATUS_LABELS, formatDateFr } from "../lib/coupons"

interface CouponCardProps {
  title: string
  description: string
  terms: string
  endDate: string
  status: CouponStatus
  index?: number
}

function extractHighlight(title: string): { highlight: string; rest: string } {
  const patterns = [/^(-\d+\s*%)/i, /^(\d+\s*%)/i]
  for (const p of patterns) {
    const m = title.match(p)
    if (m) return { highlight: m[1], rest: title.slice(m[1].length).trim() }
  }
  return { highlight: "", rest: title }
}

export function CouponCard({ title, description, terms, endDate, status, index }: CouponCardProps) {
  const { highlight, rest } = extractHighlight(title)
  const num = index !== undefined ? String(index + 1).padStart(2, "0") : null

  return (
    <div className={"cpv2-card cpv2-card--" + status}>
      <div className="cpv2-card__top">
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
