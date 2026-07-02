// Types métiers partagés de l'application 3SETS Club Pass

export type Sport = 'tennis' | 'badminton' | 'padel' | 'tennis-de-table' | 'pickleball'

export const SPORT_LABELS: Record<Sport, string> = {
  tennis: 'Tennis',
  badminton: 'Badminton',
  padel: 'Padel',
  'tennis-de-table': 'Tennis de table',
  pickleball: 'Pickleball',
}

export type CouponStatus = 'available' | 'used' | 'expired'

export interface Club {
  id: string
  name: string
  slug: string
  sport: Sport
  logo_url: string | null
  active: boolean
  created_at: string
}

export interface Player {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  sport: Sport
  club_id: string
  newsletter: boolean
  created_at: string
  club?: Club
}

export interface Coupon {
  id: string
  title: string
  description: string
  sport: Sport
  club_id: string | null
  start_date: string
  end_date: string
  terms: string
  active: boolean
  created_at: string
}

export interface PlayerCoupon {
  id: string
  player_id: string
  coupon_id: string
  status: CouponStatus
  used_at: string | null
  created_at: string
  coupon?: Coupon
  player?: Player
}

export interface Profile {
  id: string
  email: string
  role: 'admin' | 'player'
  created_at: string
}

export interface PlayerCouponView {
  playerCouponId: string
  title: string
  description: string
  terms: string
  endDate: string
  status: CouponStatus
  usedAt: string | null
}
