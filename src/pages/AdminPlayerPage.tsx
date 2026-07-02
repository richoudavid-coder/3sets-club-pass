import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { AdminLayout } from "./AdminLayout"
import { Loader } from "../components/Loader"
import { CouponCard } from "../components/CouponCard"
import { supabase } from "../lib/supabase"
import { computeDisplayStatus, formatDateFr, formatDateTimeFr } from "../lib/coupons"
import { SPORT_LABELS, type Club, type Player } from "../types"

interface PlayerCouponDetail {
  id: string
  status: "available" | "used" | "expired"
  used_at: string | null
  montant_panier: number | null
  coupon: { id: string; title: string; description: string; end_date: string }
}

export function AdminPlayerPage() {
  const { playerId } = useParams<{ playerId: string }>()
  const [player, setPlayer] = useState<(Player & { club: Club }) | null>(null)
  const [coupons, setCoupons] = useState<PlayerCouponDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<PlayerCouponDetail | null>(null)
  const [resetTarget, setResetTarget] = useState<PlayerCouponDetail | null>(null)
  const [validating, setValidating] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [montantPanier, setMontantPanier] = useState("")

  async function loadData() {
    if (!playerId) return
    setLoading(true)
    const { data: playerData, error: playerError } = await supabase
      .from("players").select("*, club:clubs(*)").eq("id", playerId).maybeSingle()
    if (playerError || !playerData) { setNotFound(true); setLoading(false); return }
    setPlayer(playerData as Player & { club: Club })
    const { data: pcData } = await supabase
      .from("player_coupons")
      .select("id, status, used_at, montant_panier, coupon:coupons(id, title, description, end_date)")
      .eq("player_id", playerId).order("created_at", { ascending: true })
    setCoupons((pcData ?? []) as unknown as PlayerCouponDetail[])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [playerId])

  async function handleValidate() {
    if (!confirmTarget) return
    setValidating(true)
    setFeedback(null)
    const montant = montantPanier ? parseFloat(montantPanier) : null
    const { data, error } = await supabase
      .from("player_coupons")
      .update({ status: "used", used_at: new Date().toISOString(), montant_panier: montant })
      .eq("id", confirmTarget.id).eq("status", "available").select()
    if (error || !data || data.length === 0) {
      setFeedback("Ce coupon ne peut pas etre valide.")
    } else {
      setFeedback("Coupon valide avec succes." + (montant ? " Panier : " + montant.toFixed(2) + " euros." : ""))
    }
    setConfirmTarget(null)
    setMontantPanier("")
    setValidating(false)
    await loadData()
  }

  async function handleReset() {
    if (!resetTarget) return
    setValidating(true)
    setFeedback(null)
    const { error } = await supabase
      .from("player_coupons")
      .update({ status: "available", used_at: null, montant_panier: null })
      .eq("id", resetTarget.id)
    if (error) {
      setFeedback("Erreur lors de la remise a disponible.")
    } else {
      setFeedback("Coupon remis en disponible avec succes.")
    }
    setResetTarget(null)
    setValidating(false)
    await loadData()
  }

  if (loading) return <AdminLayout><Loader label="Chargement de la fiche joueur..." /></AdminLayout>

  if (notFound || !player) return (
    <AdminLayout>
      <Link to="/admin" className="breadcrumb-link">Retour</Link>
      <div className="card text-center"><h2>Joueur introuvable</h2></div>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <Link to="/admin" className="breadcrumb-link">&#8592; Retour au tableau de bord</Link>
      {feedback ? <div className="form-success-banner">{feedback}</div> : null}
      <div className="card">
        <h2 style={{ marginBottom: 16 }}>{player.first_name} {player.last_name}</h2>
        <div className="player-info-grid">
          <div>Email<br /><strong>{player.email}</strong></div>
          <div>Telephone<br /><strong>{player.phone}</strong></div>
          <div>Club<br /><strong>{player.club?.name ?? "-"}</strong></div>
          <div>Sport<br /><strong>{SPORT_LABELS[player.sport as keyof typeof SPORT_LABELS]}</strong></div>
          <div>Inscription<br /><strong>{formatDateFr(player.created_at)}</strong></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button className="btn btn-danger btn-sm" onClick={() => setResetTarget({ id: player.id, status: "available", used_at: null, montant_panier: null, coupon: { id: "", title: "ce joueur", description: "", end_date: "" } })}>
            Supprimer ce joueur
          </button>
        </div>
      </div>

      <h3 className="section-title mt-24">Coupons du joueur</h3>
      <div className="coupons-grid">
        {coupons.length === 0 && <div className="empty-state">Aucun coupon attribue.</div>}
        {coupons.map((pc, i) => {
          const displayStatus = computeDisplayStatus(pc.status, pc.coupon.end_date)
          return (
            <div key={pc.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CouponCard
                index={i}
                title={pc.coupon.title}
                description={pc.coupon.description}
                terms=""
                endDate={pc.coupon.end_date}
                status={displayStatus}
              />
              {pc.used_at ? (
                <div style={{ fontSize: "0.78rem", color: "var(--grey-text)", paddingLeft: 4 }}>
                  Valide le {formatDateTimeFr(pc.used_at)}
                  {pc.montant_panier ? " · Panier : " + pc.montant_panier.toFixed(2) + " euros" : ""}
                </div>
              ) : null}
              <div style={{ display: "flex", gap: 8 }}>
                {displayStatus === "available" ? (
                  <button className="btn btn-primary btn-sm" onClick={() => setConfirmTarget(pc)}>
                    Valider l utilisation
                  </button>
                ) : null}
                {displayStatus === "used" ? (
                  <button className="btn btn-secondary btn-sm" onClick={() => setResetTarget(pc)}>
                    Remettre en disponible
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {confirmTarget ? (
        <div className="modal-overlay" onClick={() => { setConfirmTarget(null); setMontantPanier("") }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Valider ce coupon ?</h3>
            <p style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 16 }}>{confirmTarget.coupon.title}</p>
            <div className="field">
              <label>Montant du panier (euros)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={montantPanier}
                onChange={(e) => setMontantPanier(e.target.value)}
                placeholder="Ex: 85.00"
                autoFocus
              />
              <div className="field-hint">Optionnel — permet de calculer le CA reel dans les performances</div>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--grey-text)", marginBottom: 16 }}>
              Cette action est definitive. Tu pourras la corriger avec le bouton Remettre en disponible si besoin.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setConfirmTarget(null); setMontantPanier("") }} disabled={validating}>Annuler</button>
              <button className="btn btn-primary" onClick={handleValidate} disabled={validating}>
                {validating ? "Validation..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {resetTarget && resetTarget.coupon.id !== "" ? (
        <div className="modal-overlay" onClick={() => setResetTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Remettre en disponible ?</h3>
            <p>Le coupon <strong>{resetTarget.coupon.title}</strong> sera remis en statut Disponible. Le montant du panier enregistre sera efface.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setResetTarget(null)} disabled={validating}>Annuler</button>
              <button className="btn btn-danger" onClick={handleReset} disabled={validating}>
                {validating ? "En cours..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  )
}
