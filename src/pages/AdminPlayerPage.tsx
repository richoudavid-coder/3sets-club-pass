import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AdminLayout } from './AdminLayout'
import { Loader } from '../components/Loader'
import { StatusPill } from '../components/StatusPill'
import { ConfirmModal } from '../components/ConfirmModal'
import { supabase } from '../lib/supabase'
import { computeDisplayStatus, formatDateFr, formatDateTimeFr } from '../lib/coupons'
import { SPORT_LABELS, type Club, type Player } from '../types'

interface PlayerCouponDetail {
  id: string
  status: 'available' | 'used' | 'expired'
  used_at: string | null
  coupon: {
    id: string
    title: string
    description: string
    end_date: string
  }
}

export function AdminPlayerPage() {
  const { playerId } = useParams<{ playerId: string }>()
  const [player, setPlayer] = useState<(Player & { club: Club }) | null>(null)
  const [coupons, setCoupons] = useState<PlayerCouponDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<PlayerCouponDetail | null>(null)
  const [validating, setValidating] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  async function loadData() {
    if (!playerId) return
    setLoading(true)

    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('*, club:clubs(*)')
      .eq('id', playerId)
      .maybeSingle()

    if (playerError || !playerData) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setPlayer(playerData as Player & { club: Club })

    const { data: pcData } = await supabase
      .from('player_coupons')
      .select('id, status, used_at, coupon:coupons(id, title, description, end_date)')
      .eq('player_id', playerId)
      .order('created_at', { ascending: true })

    setCoupons((pcData ?? []) as unknown as PlayerCouponDetail[])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId])

  async function handleValidate() {
    if (!confirmTarget) return
    setValidating(true)
    setFeedback(null)

    // Garde-fou : on ne valide que si le coupon est encore "available" en base
    // (empêche toute double validation, même en cas de double-clic ou d'onglets multiples)
    const { data, error } = await supabase
      .from('player_coupons')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('id', confirmTarget.id)
      .eq('status', 'available')
      .select()

    if (error || !data || data.length === 0) {
      setFeedback("Ce coupon n'a pas pu être validé : il a peut-être déjà été utilisé entre-temps.")
    } else {
      setFeedback(`Coupon "${confirmTarget.coupon.title}" validé avec succès.`)
    }

    setConfirmTarget(null)
    setValidating(false)
    await loadData()
  }

  if (loading) {
    return (
      <AdminLayout>
        <Loader label="Chargement de la fiche joueur…" />
      </AdminLayout>
    )
  }

  if (notFound || !player) {
    return (
      <AdminLayout>
        <Link to="/admin" className="breadcrumb-link">
          ← Retour au tableau de bord
        </Link>
        <div className="card text-center">
          <h2>Joueur introuvable</h2>
          <p style={{ color: 'var(--grey-text)', marginTop: 10 }}>
            Ce joueur n'existe pas ou a été supprimé.
          </p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Link to="/admin" className="breadcrumb-link">
        ← Retour au tableau de bord
      </Link>

      {feedback && <div className="form-success-banner">{feedback}</div>}

      <div className="card">
        <h2 style={{ marginBottom: 16 }}>
          {player.first_name} {player.last_name}
        </h2>
        <div className="player-info-grid">
          <div>
            Email
            <br />
            <strong>{player.email}</strong>
          </div>
          <div>
            Téléphone
            <br />
            <strong>{player.phone}</strong>
          </div>
          <div>
            Club
            <br />
            <strong>{player.club?.name ?? '—'}</strong>
          </div>
          <div>
            Sport
            <br />
            <strong>{SPORT_LABELS[player.sport]}</strong>
          </div>
          <div>
            Date d'inscription
            <br />
            <strong>{formatDateFr(player.created_at)}</strong>
          </div>
        </div>
      </div>

      <h3 className="section-title mt-24">Coupons du joueur</h3>

      <div className="coupons-grid">
        {coupons.length === 0 && (
          <div className="empty-state">Ce joueur n'a aucun coupon attribué.</div>
        )}

        {coupons.map((pc) => {
          const displayStatus = computeDisplayStatus(pc.status, pc.coupon.end_date)
          return (
            <div className="coupon-card" data-status={displayStatus} key={pc.id}>
              <div className="coupon-card__top">
                <div className="coupon-card__title">{pc.coupon.title}</div>
                <StatusPill status={displayStatus} />
              </div>
              <p className="coupon-card__desc">{pc.coupon.description}</p>
              <div className="coupon-card__footer">
                <span>Limite : {formatDateFr(pc.coupon.end_date)}</span>
                {pc.used_at && <span>Utilisé le {formatDateTimeFr(pc.used_at)}</span>}
              </div>

              {displayStatus === 'available' && (
                <button
                  className="btn btn-primary btn-sm"
                  style={{ alignSelf: 'flex-start', marginTop: 4 }}
                  onClick={() => setConfirmTarget(pc)}
                >
                  Valider l'utilisation
                </button>
              )}
            </div>
          )
        })}
      </div>

      {confirmTarget && (
        <ConfirmModal
          title="Valider ce coupon ?"
          message="Confirmer l'utilisation de ce coupon ? Cette action est définitive et ne pourra pas être annulée."
          confirmLabel="Valider"
          onConfirm={handleValidate}
          onCancel={() => setConfirmTarget(null)}
          busy={validating}
        />
      )}
    </AdminLayout>
  )
}
