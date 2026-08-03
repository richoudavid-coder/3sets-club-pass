import { describe, expect, it, vi, afterEach } from 'vitest'
import { computeDisplayStatus, formatDateFr } from './coupons'

afterEach(() => vi.useRealTimers())

describe('computeDisplayStatus', () => {
  it('conserve le statut utilisé même après expiration', () => {
    expect(computeDisplayStatus('used', '2020-01-01')).toBe('used')
  })
  it('marque un coupon dépassé comme expiré', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2027-09-01T12:00:00+02:00'))
    expect(computeDisplayStatus('available', '2027-08-31')).toBe('expired')
  })
  it('garde disponible un coupon valable aujourd’hui', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2027-08-31T12:00:00+02:00'))
    expect(computeDisplayStatus('available', '2027-08-31')).toBe('available')
  })
})

describe('formatDateFr', () => {
  it('formate une date en français', () => {
    expect(formatDateFr('2027-08-31')).toMatch(/31 août 2027/)
  })
})
