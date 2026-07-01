import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AdminLayout } from './AdminLayout'
import { Loader } from '../components/Loader'
import { CouponCard } from '../components/CouponCard'
import { ConfirmModal } from '../components/ConfirmModal'
import { supabase } from '../lib/supabase'
import { computeDisplayStatus, formatDateFr, formatDateTimeFr } from '../lib/coupons'
import { SPORT_LABELS } from '../types'

export function AdminPlayerPage() {
  const { playerId } = useParams()
  const [player, setPlayer] = useState(null)
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [validating, setValidating] = useState(false)
  const [feedback, setFeedback] = useState(null)

  async function loadData() {
    if (!playerId) return
    setLoading(true)
    const { data: playerData, error: playerError } = await supabase
      .from('players').select('*, club:clubs(*)').eq('id', playerId).maybeSingle()
    if (playerError || !playerData) { setNotFound(true); setLoading(false); return }
    setPlayer(playerData)
    const { data: pcData } = await supabase
      .from('player_coupons')
      .select('id, status, used_at, coupon:coupons(id, title, description, end_date)')
      .eq('player_id', playerId).order('created_at', { ascending: true })
    setCoupons(pcData || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [playerId])

  async function handleValidate() {
    if (!confirmTarget) return
    setValidating(true)
    setFeedback(null)
    const { data, error } = await supabase
      .from('player_coupons')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('id', confirmTarget.id).eq('status', 'available').select()
    if (error || !data || data.length === 0) {
      setFeedback('Ce coupon ne peut pas etre valide : il a peut-etre deja ete utilise.')
    } else {
      setFeedback('Coupon "' + confirmTarget.coupon.title + '" valide avec succes.')
    }
    setConfirmTarget(null)
    setValidating(false)
    await loadData()
  }

  if (loading) return <AdminLayout><Loader label="Chargement de la fiche joueur..." /></AdminLayout>

  if (notFound || !player) return (
    <AdminLayout>
      <Link to="/admin" className="breadcrumb-link">Retour au tableau de bord</Link>
      <div className="card text-center"><h2>Joueur introuvable</h2></div>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <Link to="/admin" className="breadcrumb-link">← Retour au tableau de bord</Link>

      {feedback ? <div className="form-success-banner">{feedback}</div> : null}

      <div className="card">
        <h2 style={{ marginBottom: 16 }}>{player.first_name} {player.last_name}</h2>
        <div className="player-info-grid">
          <div>Email<br /><strong>{player.email}</strong></div>
          <div>Telephone<br /><strong>{player.phone}</strong></div>
          <div>Club<br /><strong>{player.club?.name ?? '-'}</strong></div>
          <div>Sport<br /><strong>{SPORT_LABELS[player.sport]}</strong></div>
          <div>Inscription<br /><strong>{formatDateFr(player.created_at)}</strong></div>
        </div>
      </div>

      <h3 className="section-title mt-24">Coupons du joueur</h3>

      <div className="coupons-grid">
        {coupons.length === 0 && (
          <div className="empty-state">Ce joueur n'a aucun coupon attribue.</div>
        )}
        {coupons.map((pc, i) => {
          const displayStatus = computeDisplayStatus(pc.status, pc.coupon.end_date)
          return (
            <div key={pc.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <CouponCard
                index={i}
                title={pc.coupon.title}
                description={pc.coupon.description}
                terms=""
                endDate={pc.coupon.end_date}
                status={displayStatus}
              />
              {pc.used_at ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--grey-text)', paddingLeft: 4 }}>
                  Valide le {formatDateTimeFr(pc.used_at)}
                </div>
              ) : null}
              {displayStatus === 'available' ? (
                <button
                  className="btn btn-primary btn-sm"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => setConfirmTarget(pc)}
                >
                  Valider l'utilisation
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      {confirmTarget ? (
        <ConfirmModal
          title="Valider ce coupon ?"
          message="Confirmer l'utilisation de ce coupon ? Cette action est definitive."
          confirmLabel="Valider"
          onConfirm={handleValidate}
          onCancel={() => setConfirmTarget(null)}
          busy={validating}
        />
      ) : null}
    </AdminLayout>
  )
}
