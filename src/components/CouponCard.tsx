import type { CouponStatus } from '../types'
import { STATUS_LABELS, formatDateFr } from '../lib/coupons'

interface CouponCardProps {
  title: string
  description: string
  terms: string
  endDate: string
  status: CouponStatus
  index?: number
}

function extractHighlight(title: string): { highlight: string; rest: string } {
  const patterns = [
    /^(-\d+\s*%)/i,
    /^(\d+\s*%)/i,
    /^(1\s+\w+\s+offert[e]?)/i,
    /^(\d+(?:eme|e|er)?\s+\w+\s+(?:offert[e]?|a\s+-\d+\s*%))/i,
  ]
  for (const p of patterns) {
    const m = title.match(p)
    if (m) {
      return { highlight: m[1], rest: title.slice(m[1].length).trim() }
    }
  }
  return { highlight: '', rest: title }
}

export function CouponCard({ title, description, terms, endDate, status, index }: CouponCardProps) {
  const { highlight, rest } = extractHighlight(title)
  const num = index !== undefined ? String(index + 1).padStart(2, '0') : null

  return (
    <div className={'cp-card cp-card--' + status}>
      <div className="cp-card__header">
        {num ? <span className="cp-card__num">{num}</span> : null}
        <span className="cp-card__date">{'Jusqu\'au ' + formatDateFr(endDate)}</span>
      </div>

      {highlight ? (
        <>
          <div className="cp-card__highlight">{highlight}</div>
          <div className="cp-card__label">{rest}</div>
        </>
      ) : (
        <div className="cp-card__label cp-card__label--full">{title}</div>
      )}

      <div className="cp-card__desc">{description}</div>

      <div className="cp-card__footer">
        <span className={'cp-card__status cp-card__status--' + status}>
          {STATUS_LABELS[status]}
        </span>
        {terms ? <span className="cp-card__terms">{terms}</span> : null}
      </div>
    </div>
  )
}
