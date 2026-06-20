import type { CouponStatus } from '../types'
import { StatusPill } from './StatusPill'
import { formatDateFr } from '../lib/coupons'

interface CouponCardProps {
  title: string
  description: string
  terms: string
  endDate: string
  status: CouponStatus
}

export function CouponCard({ title, description, terms, endDate, status }: CouponCardProps) {
  return (
    <div className="coupon-card" data-status={status}>
      <div className="coupon-card__top">
        <div className="coupon-card__title">{title}</div>
        <StatusPill status={status} />
      </div>
      <p className="coupon-card__desc">{description}</p>
      <p className="coupon-card__terms">{terms}</p>
      <div className="coupon-card__footer">
        <span>Valable jusqu'au {formatDateFr(endDate)}</span>
      </div>
    </div>
  )
}
