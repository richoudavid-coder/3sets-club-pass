import type { CouponStatus } from '../types'

/**
 * Calcule le statut "affichable" d'un coupon pour un joueur.
 * - Si déjà marqué "used" en base => Utilisé (priorité absolue, même si la date est dépassée)
 * - Sinon, si la date de fin est dépassée => Expiré
 * - Sinon => Disponible
 */
export function computeDisplayStatus(
  storedStatus: CouponStatus,
  endDate: string
): CouponStatus {
  if (storedStatus === 'used') return 'used'

  const end = new Date(endDate + 'T23:59:59')
  const now = new Date()
  if (now > end) return 'expired'

  return 'available'
}

export const STATUS_LABELS: Record<CouponStatus, string> = {
  available: 'Disponible',
  used: 'Utilisé',
  expired: 'Expiré',
}

export function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function formatDateTimeFr(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
