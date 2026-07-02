import { useEffect, useState, type FormEvent } from "react"
import { AdminLayout } from "./AdminLayout"
import { ConfirmModal } from "../components/ConfirmModal"
import { Loader } from "../components/Loader"
import { supabase } from "../lib/supabase"
import { SPORT_LABELS, type Coupon, type Sport } from "../types"
import { formatDateFr } from "../lib/coupons"

export function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const emptyForm = {
    title: "", description: "", terms: "",
    sport: "tennis", club_id: null,
    start_date: "2026-09-01", end_date: "2027-08-31", active: true
  }
  const [form, setForm] = useState(emptyForm)

  async function loadCoupons() {
    setLoading(true)
    const { data } = await supabase.from("coupons").select("*").order("sport").order("title")
    setCoupons(data || [])
    setLoading(false)
  }

  useEffect(() => { loadCoupons() }, [])

  function startEdit(coupon: any) {
    setEditing(coupon.id)
    setForm({
      title: coupon.title,
      description: coupon.description,
      terms: coupon.terms,
      sport: coupon.sport,
      club_id: coupon.club_id,
      start_date: coupon.start_date,
      end_date: coupon.end_date,
      active: coupon.active,
    })
    setShowForm(true)
    setError(null)
    setFeedback(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function startCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
    setError(null)
    setFeedback(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSubmit(e: any) {
    e.preventDefault()
    setError(null)
    if (!form.title.trim() || !form.description.trim() || !form.terms.trim()) {
      setError("Merci de remplir tous les champs obligatoires.")
      return
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      terms: form.terms.trim(),
      sport: form.sport,
      club_id: form.club_id || null,
      start_date: form.start_date,
      end_date: form.end_date,
      active: form.active,
    }
    if (editing) {
      const { error: updateError } = await supabase.from("coupons").update(payload).eq("id", editing)
      if (updateError) { setError("Erreur lors de la modification."); return }
      setFeedback("Coupon modifie avec succes.")
    } else {
      const { error: insertError } = await supabase.from("coupons").insert(payload)
      if (insertError) { setError("Erreur lors de la creation."); return }
      setFeedback("Coupon cree avec succes.")
    }
    setEditing(null)
    setForm(emptyForm)
    setShowForm(false)
    loadCoupons()
  }

  async function handleDeleteCoupon() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from("coupons").delete().eq("id", deleteTarget.id)
    setFeedback("Coupon supprime avec succes.")
    setDeleteTarget(null)
    setDeleting(false)
    loadCoupons()
  }

  async function toggleActive(coupon: any) {
    await supabase.from("coupons").update({ active: !coupon.active }).eq("id", coupon.id)
    loadCoupons()
  }

  if (loading) return <AdminLayout><Loader label="Chargement des coupons..." /></AdminLayout>

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <h1>Gestion des coupons</h1>
        <button className="btn btn-primary btn-sm" onClick={startCreate}>+ Nouveau coupon</button>
      </div>

      {feedback ? <div className="form-success-banner">{feedback}</div> : null}

      {showForm ? (
        <div className="card mt-24">
          <h3 className="section-title">{editing ? "Modifier le coupon" : "Nouveau coupon"}</h3>
          <form onSubmit={handleSubmit}>
            {error ? <div className="form-error-banner">{error}</div> : null}
            <div className="field">
              <label>Titre *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="-20% chaussures Padel Wilson" />
            </div>
            <div className="field">
              <label>Description *</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Offre valable sur la selection en magasin." />
            </div>
            <div className="field">
              <label>Conditions *</label>
              <input value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} placeholder="Non cumulable, valable une seule fois." />
            </div>
            <div className="field">
              <label>Sport</label>
              <select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })}>
                {Object.keys(SPORT_LABELS).map((key) => (
                  <option key={key} value={key}>{SPORT_LABELS[key as keyof typeof SPORT_LABELS]}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Date de debut</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="field">
              <label>Date de fin</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div className="field" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} style={{ width: 18, height: 18, accentColor: "var(--orange)" }} />
              <label htmlFor="active" style={{ fontWeight: 400, cursor: "pointer" }}>Coupon actif (visible et attribuable)</label>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary">{editing ? "Enregistrer les modifications" : "Creer le coupon"}</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(null); setError(null) }}>Annuler</button>
            </div>
          </form>
        </div>
      ) : null}

      <h3 className="section-title mt-24">Coupons existants ({coupons.length})</h3>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Sport</th>
              <th>Fin</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} style={{ opacity: coupon.active ? 1 : 0.5 }}>
                <td><strong>{coupon.title}</strong><br /><span style={{ fontSize: "0.78rem", color: "var(--grey-text)" }}>{coupon.description}</span></td>
                <td>{SPORT_LABELS[coupon.sport as keyof typeof SPORT_LABELS]}</td>
                <td>{formatDateFr(coupon.end_date)}</td>
                <td>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "4px 10px", borderRadius: 100, background: coupon.active ? "var(--success-bg)" : "var(--neutral-bg)", color: coupon.active ? "var(--success)" : "var(--neutral)" }}>
                    {coupon.active ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => startEdit(coupon)}>Modifier</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(coupon)}>{coupon.active ? "Desactiver" : "Reactiver"}</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(coupon)}>Supprimer</button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--grey-text)" }}>Aucun coupon pour le moment.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {deleteTarget ? (
        <ConfirmModal
          title="Supprimer ce coupon ?"
          message={"Confirmer la suppression du coupon \"" + deleteTarget.title + "\" ? Cette action est irreversible."}
          confirmLabel="Supprimer definitivement"
          onConfirm={handleDeleteCoupon}
          onCancel={() => setDeleteTarget(null)}
          busy={deleting}
        />
      ) : null}
    </AdminLayout>
  )
}
