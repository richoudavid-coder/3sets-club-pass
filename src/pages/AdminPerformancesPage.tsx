import { useEffect, useState } from "react"
import { AdminLayout } from "./AdminLayout"
import { Loader } from "../components/Loader"
import { supabase } from "../lib/supabase"
import { SPORT_LABELS } from "../types"

export function AdminPerformancesPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any[]>([])
  const [totalCA, setTotalCA] = useState(0)
  const [totalCoupons, setTotalCoupons] = useState(0)
  const [totalJoueurs, setTotalJoueurs] = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: clubs } = await supabase.from("clubs").select("id, name, sport, sports")
      const { data: players } = await supabase.from("players").select("id, club_id")
      const { data: pc } = await supabase
        .from("player_coupons")
        .select("id, status, player_id, montant_panier, coupon:coupons(valeur_euros, sport)")
        .eq("status", "used")

      const clubStats = (clubs || []).map((club: any) => {
        const clubPlayers = (players || []).filter((p: any) => p.club_id === club.id)
        const playerIds = clubPlayers.map((p: any) => p.id)
        const usedCoupons = (pc || []).filter((p: any) => playerIds.includes(p.player_id))
        const caReel = usedCoupons.reduce((sum: number, p: any) => sum + (p.montant_panier || 0), 0)
        const caEstime = usedCoupons.reduce((sum: number, p: any) => sum + (p.coupon?.valeur_euros || 0), 0)
        const panierCount = usedCoupons.filter((p: any) => p.montant_panier > 0).length
        return {
          id: club.id,
          name: club.name,
          sport: club.sport,
          sports: club.sports,
          joueurs: clubPlayers.length,
          couponsUtilises: usedCoupons.length,
          caReel: caReel,
          caEstime: caEstime,
          ca: caReel > 0 ? caReel : caEstime,
          panierCount: panierCount,
        }
      }).sort((a: any, b: any) => b.ca - a.ca)

      setStats(clubStats)
      setTotalCA(clubStats.reduce((s: number, c: any) => s + c.caReel, 0))
      setTotalCoupons(clubStats.reduce((s: number, c: any) => s + c.couponsUtilises, 0))
      setTotalJoueurs(clubStats.reduce((s: number, c: any) => s + c.joueurs, 0))
      setLoading(false)
    }
    load()
  }, [])

  const maxCA = Math.max(...stats.map((s) => s.ca), 1)

  if (loading) return <AdminLayout><Loader label="Chargement des performances..." /></AdminLayout>

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <h1>Performances par club</h1>
      </div>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-card__value">{totalJoueurs}</div>
          <div className="stat-card__label">Joueurs inscrits</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{totalCoupons}</div>
          <div className="stat-card__label">Coupons utilisés</div>
        </div>
        <div className="stat-card stat-card--accent">
          <div className="stat-card__value">{totalCA.toFixed(0)} €</div>
          <div className="stat-card__label">CA réel (paniers saisis)</div>
        </div>
      </div>

      <h3 className="section-title">CA influence par club</h3>

      <div className="card" style={{ marginBottom: 28, padding: 24 }}>
        {stats.map((club) => (
          <div key={club.id} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.88rem", fontWeight: 700, color: "var(--navy)" }}>
              <span>{club.name}</span>
              <span style={{ color: "var(--orange)" }}>{club.ca.toFixed(0)} €</span>
            </div>
            <div style={{ background: "var(--grey-line)", borderRadius: 100, height: 10, overflow: "hidden" }}>
              <div style={{
                background: club.ca > 0 ? "var(--orange)" : "var(--grey-line)",
                width: (club.ca / maxCA * 100) + "%",
                height: "100%",
                borderRadius: 100,
                transition: "width 0.5s ease"
              }} />
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--grey-text)", marginTop: 4 }}>
              {club.joueurs} joueur(s) · {club.couponsUtilises} coupon(s) utilise(s)
            </div>
          </div>
        ))}
        {stats.every((s) => s.ca === 0) && (
          <p style={{ color: "var(--grey-text)", fontSize: "0.88rem", textAlign: "center" }}>
            Aucun coupon utilise pour le moment. Ajoutez des valeurs sur vos coupons dans la gestion des coupons.
          </p>
        )}
      </div>

      <h3 className="section-title">Détail par club</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Club</th>
              <th>Sport(s)</th>
              <th>Joueurs</th>
              <th>Coupons utilisés</th>
              <th>CA réel</th>
              <th>CA estimé</th>
              <th>Moy. panier</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((club) => (
              <tr key={club.id}>
                <td><strong>{club.name}</strong></td>
                <td style={{ fontSize: "0.78rem" }}>
                  {(club.sports && club.sports.length > 0 ? club.sports : [club.sport])
                    .map((s: string) => SPORT_LABELS[s as keyof typeof SPORT_LABELS])
                    .join(" · ")}
                </td>
                <td>{club.joueurs}</td>
                <td>{club.couponsUtilises}</td>
                <td style={{ fontWeight: 700, color: club.caReel > 0 ? "var(--orange)" : "var(--grey-text)" }}>
                  {club.caReel > 0 ? club.caReel.toFixed(2) + " €" : "-"}
                </td>
                <td style={{ color: "var(--grey-text)" }}>
                  {club.caEstime > 0 ? club.caEstime.toFixed(2) + " €" : "-"}
                </td>
                <td style={{ color: "var(--grey-text)" }}>
                  {club.panierCount > 0 ? (club.caReel / club.panierCount).toFixed(2) + " €" : "-"}
                </td>
              </tr>
            ))}
            {stats.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--grey-text)" }}>Aucun club trouve.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
