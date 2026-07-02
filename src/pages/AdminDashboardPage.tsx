import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout } from './AdminLayout'
import { Loader } from '../components/Loader'
import { supabase } from '../lib/supabase'
import { computeDisplayStatus } from '../lib/coupons'
import { downloadCsv } from '../lib/csv'
import { SPORT_LABELS, type Club, type Player, type Sport } from '../types'

interface PlayerRow extends Player {
  club: Club
}

interface PlayerCouponRow {
  id: string
  status: 'available' | 'used' | 'expired'
  used_at: string | null
  player: { first_name: string; last_name: string; email: string; phone: string; sport: Sport }
  coupon: { title: string; end_date: string }
  player_club_name?: string
}

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [playerCoupons, setPlayerCoupons] = useState<PlayerCouponRow[]>([])

  const [search, setSearch] = useState('')
  const [clubFilter, setClubFilter] = useState('all')
  const [sportFilter, setSportFilter] = useState<'all' | Sport>('all')

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: playersData } = await supabase
        .from('players')
        .select('*, club:clubs(*)')
        .order('created_at', { ascending: false })

      setPlayers((playersData ?? []) as PlayerRow[])

      const { data: pcData } = await supabase
        .from('player_coupons')
        .select('id, status, used_at, player:players(first_name,last_name,email,phone,sport), coupon:coupons(title,end_date)')

      setPlayerCoupons((pcData ?? []) as unknown as PlayerCouponRow[])

      setLoading(false)
    }
    load()
  }, [])

  const stats = useMemo(() => {
    const totalPlayers = players.length

    const byClub: Record<string, number> = {}
    const bySport: Record<string, number> = {}
    players.forEach((p) => {
      const clubName = p.club?.name ?? 'Inconnu'
      byClub[clubName] = (byClub[clubName] ?? 0) + 1
      bySport[p.sport] = (bySport[p.sport] ?? 0) + 1
    })

    let totalCoupons = playerCoupons.length
    let used = 0
    let expired = 0

    playerCoupons.forEach((pc) => {
      const displayStatus = computeDisplayStatus(pc.status, pc.coupon?.end_date ?? '2999-12-31')
      if (displayStatus === 'used') used++
      if (displayStatus === 'expired') expired++
    })

    const usageRate = totalCoupons > 0 ? Math.round((used / totalCoupons) * 100) : 0

    return { totalPlayers, byClub, bySport, totalCoupons, used, expired, usageRate }
  }, [players, playerCoupons])

  const uniqueClubs = useMemo(() => {
    const map = new Map<string, string>()
    players.forEach((p) => {
      if (p.club) map.set(p.club.id, p.club.name)
    })
    return Array.from(map.entries())
  }, [players])

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (clubFilter !== 'all' && p.club?.id !== clubFilter) return false
      if (sportFilter !== 'all' && p.sport !== sportFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const haystack = `${p.first_name} ${p.last_name} ${p.email} ${p.phone}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [players, clubFilter, sportFilter, search])

  function exportNewsletterCsv() {
    const subscribers = filteredPlayers.filter((p) => p.newsletter)
    downloadCsv(
      'newsletter-3sets.csv',
      ['Prenom', 'Nom', 'Email', 'Telephone', 'Sport', 'Club', 'Inscription'],
      subscribers.map((p) => [
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        SPORT_LABELS[p.sport],
        p.club?.name ?? '',
        new Date(p.created_at).toLocaleDateString('fr-FR'),
      ])
    )
  }

  function exportPlayersCsv() {
    downloadCsv(
      'joueurs-3sets-club-pass.csv',
      ['Prenom', 'Nom', 'Email', 'Telephone', 'Sport', 'Club', 'Inscription', 'Newsletter'],
      filteredPlayers.map((p) => [
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        SPORT_LABELS[p.sport],
        p.club?.name ?? '',
        new Date(p.created_at).toLocaleDateString('fr-FR'),
        p.newsletter ? 'Oui' : 'Non',
      ])
    )
  }

  function exportCouponsCsv() {
    downloadCsv(
      'utilisations-coupons-3sets.csv',
      ['Joueur', 'Email', 'Téléphone', 'Club', 'Sport', 'Coupon', 'Statut', 'Utilisé le'],
      playerCoupons.map((pc) => {
        const status = computeDisplayStatus(pc.status, pc.coupon?.end_date ?? '2999-12-31')
        const statusLabel = status === 'available' ? 'Disponible' : status === 'used' ? 'Utilisé' : 'Expiré'
        return [
          `${pc.player?.first_name ?? ''} ${pc.player?.last_name ?? ''}`,
          pc.player?.email ?? '',
          pc.player?.phone ?? '',
          players.find((p) => p.email === pc.player?.email)?.club?.name ?? '',
          pc.player ? SPORT_LABELS[pc.player.sport] : '',
          pc.coupon?.title ?? '',
          statusLabel,
          pc.used_at ? new Date(pc.used_at).toLocaleString('fr-FR') : '',
        ]
      })
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        <Loader label="Chargement du tableau de bord…" />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <h1>Tableau de bord</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportPlayersCsv}>
            Exporter les joueurs CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={exportNewsletterCsv}>
            Exporter newsletter CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={exportCouponsCsv}>
            Exporter les utilisations CSV
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__value">{stats.totalPlayers}</div>
          <div className="stat-card__label">Inscrits au total</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats.totalCoupons}</div>
          <div className="stat-card__label">Coupons attribués</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats.used}</div>
          <div className="stat-card__label">Coupons utilisés</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats.expired}</div>
          <div className="stat-card__label">Coupons expirés</div>
        </div>
        <div className="stat-card stat-card--accent">
          <div className="stat-card__value">{stats.usageRate}%</div>
          <div className="stat-card__label">Taux d'utilisation</div>
        </div>
      </div>

      <div className="breakdown-grid">
        <div className="card">
          <h3 className="section-title">Inscrits par club</h3>
          {Object.entries(stats.byClub).map(([club, count]) => (
            <div className="breakdown-row" key={club}>
              <span>{club}</span>
              <strong>{count}</strong>
            </div>
          ))}
          {Object.keys(stats.byClub).length === 0 && (
            <p style={{ color: 'var(--grey-text)', fontSize: '0.88rem' }}>Aucune inscription pour le moment.</p>
          )}
        </div>

        <div className="card">
          <h3 className="section-title">Inscrits par sport</h3>
          {Object.entries(stats.bySport).map(([sport, count]) => (
            <div className="breakdown-row" key={sport}>
              <span>{SPORT_LABELS[sport as Sport]}</span>
              <strong>{count}</strong>
            </div>
          ))}
          {Object.keys(stats.bySport).length === 0 && (
            <p style={{ color: 'var(--grey-text)', fontSize: '0.88rem' }}>Aucune inscription pour le moment.</p>
          )}
        </div>
      </div>

      <h3 className="section-title">Liste des joueurs</h3>

      <div className="filters-bar">
        <input
          placeholder="Rechercher par nom, email ou téléphone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={clubFilter} onChange={(e) => setClubFilter(e.target.value)}>
          <option value="all">Tous les clubs</option>
          {uniqueClubs.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value as 'all' | Sport)}>
          <option value="all">Tous les sports</option>
          {Object.entries(SPORT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Prénom</th>
              <th>Nom</th>
              <th>Club</th>
              <th>Sport</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((p) => (
              <tr key={p.id}>
                <td>{p.first_name}</td>
                <td>{p.last_name}</td>
                <td>{p.club?.name ?? '—'}</td>
                <td>{SPORT_LABELS[p.sport]}</td>
                <td>{p.email}</td>
                <td>{p.phone}</td>
                <td>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/admin/player/${p.id}`)}
                  >
                    Ouvrir
                  </button>
                </td>
              </tr>
            ))}
            {filteredPlayers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--grey-text)' }}>
                  Aucun joueur ne correspond à ces critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
