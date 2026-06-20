import type { CouponStatus } from '../types'
import { STATUS_LABELS } from '../lib/coupons'

export function StatusPill({ status }: { status: CouponStatus }) {
  return <span className={`status-pill status-pill--${status}`}>{STATUS_LABELS[status]}</span>
}
