import { useEffect, useState, type FormEvent } from "react"
import { AdminLayout } from "./AdminLayout"
import { Loader } from "../components/Loader"
import { ConfirmModal } from "../components/ConfirmModal"
import { supabase } from "../lib/supabase"
import { formatDateFr } from "../lib/coupons"

const COLORS = [
  { value: "orange", label: "Orange", bg: "#ff7a1a" },
  { value: "navy", label: "Bleu marine", bg: "#0a1f44" },
  { value: "green", label: "Vert", bg: "#1ea672" },
  { value: "red", label: "Rouge", bg: "#d7263d" },
  { value: "purple", label: "Violet", bg: "#7c3aed" },
]

export function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [coupons, setCoupons] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)

  const emptyForm = {
    title: "", message: "", color: "orange",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "", image_url: "", active: true, description: "", coupon_id: ""
  }
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  async function loadNotifications() {
    setLoading(true)
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false })
    setNotifications(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadNotifications()
    supabase.from("coupons").select("id, title, sport").eq("active", true).order("sport").then(({ data }) => setCoupons(data || []))
  }, [])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return form.image_url || null
    setUploading(true)
    const fileName = "notif-" + Date.now() + "-" + imageFile.name.replace(/[^a-z0-9.]/gi, "-")
    const { error: uploadError } = await supabase.storage.from("images").upload(fileName, imageFile, { upsert: true })
    if (uploadError) { setError("Erreur upload image."); setUploading(false); return null }
    const { data } = supabase.storage.from("images").getPublicUrl(fileName)
    setUploading(false)
    return data.publicUrl
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.title.trim() || !form.message.trim() || !form.end_date) {
      setError("Merci de remplir le titre, le message et la date de fin.")
      return
    }
    setSubmitting(true)
    const imageUrl = await uploadImage()
    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      color: form.color,
      start_date: form.start_date,
      end_date: form.end_date,
      image_url: imageUrl,
      active: form.active,
      description: form.description || null,
      coupon_id: form.coupon_id || null,
    }
    const { error: insertError } = await supabase.from("notifications").insert(payload)
    if (insertError) { setError("Erreur lors de la creation."); setSubmitting(false); return }
    setFeedback("Notification creee avec succes.")
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview(null)
    setShowForm(false)
    setSubmitting(false)
    loadNotifications()
  }

  async function toggleActive(notif: any) {
    await supabase.from("notifications").update({ active: !notif.active }).eq("id", notif.id)
    loadNotifications()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from("notifications").delete().eq("id", deleteTarget.id)
    setFeedback("Notification supprimee.")
    setDeleteTarget(null)
    setDeleting(false)
    loadNotifications()
  }

  if (loading) return <AdminLayout><Loader label="Chargement des notifications..." /></AdminLayout>

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <h1>Notifications clients</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setForm(emptyForm); setImagePreview(null) }}>
          + Nouvelle notification
        </button>
      </div>

      {feedback ? <div className="form-success-banner">{feedback}</div> : null}

      {showForm ? (
        <div className="card mt-24">
          <h3 className="section-title">Nouvelle notification</h3>
          <form onSubmit={handleSubmit}>
            {error ? <div className="form-error-banner">{error}</div> : null}
            <div className="field">
              <label>Titre *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Offre speciale Noel" />
            </div>
            <div className="field">
              <label>Message *</label>
              <input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Profitez de nos offres exceptionnelles jusqu'au 25 decembre !" />
            </div>
            <div className="field">
              <label>Couleur de la banniere</label>
              <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                {COLORS.map((c) => (
                  <label key={c.value} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input type="radio" name="color" value={c.value} checked={form.color === c.value} onChange={() => setForm({ ...form, color: c.value })} />
                    <span style={{ background: c.bg, color: "white", padding: "4px 12px", borderRadius: 100, fontSize: "0.8rem", fontWeight: 700 }}>{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Description detaillee (optionnel)</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Decrivez l operation en detail..." rows={3} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--grey-line)", borderRadius: 8, fontFamily: "inherit", fontSize: "1rem", resize: "vertical" }} />
            </div>
            <div className="field">
              <label>Coupon lie (optionnel)</label>
              <select value={form.coupon_id} onChange={(e) => setForm({ ...form, coupon_id: e.target.value })}>
                <option value="">-- Aucun coupon lie --</option>
                {coupons.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <div className="field-hint">Le client pourra voir ce coupon en cliquant sur la notification</div>
            </div>
            <div className="field">
              <label>Image (optionnel)</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" style={{ marginTop: 10, maxHeight: 160, borderRadius: 8, objectFit: "cover", width: "100%" }} />
              ) : null}
              <div className="field-hint">Photo produit, affiche promo... JPG ou PNG recommande.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="field">
                <label>Date de debut *</label>
                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="field">
                <label>Date de fin *</label>
                <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="field" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" id="notif-active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} style={{ width: 18, height: 18, accentColor: "var(--orange)" }} />
              <label htmlFor="notif-active" style={{ fontWeight: 400, cursor: "pointer" }}>Notification active (visible par les clients)</label>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting || uploading}>
                {uploading ? "Upload image..." : submitting ? "Creation..." : "Publier la notification"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      ) : null}

      <h3 className="section-title mt-24">Notifications existantes ({notifications.length})</h3>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Message</th>
              <th>Periode</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notif) => (
              <tr key={notif.id} style={{ opacity: notif.active ? 1 : 0.5 }}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: COLORS.find((c) => c.value === notif.color)?.bg || "#ff7a1a", width: 10, height: 10, borderRadius: "50%", flexShrink: 0, display: "inline-block" }} />
                    <strong>{notif.title}</strong>
                  </div>
                  {notif.image_url ? <img src={notif.image_url} alt="" style={{ marginTop: 4, height: 40, borderRadius: 4, objectFit: "cover" }} /> : null}
                </td>
                <td style={{ fontSize: "0.85rem", maxWidth: 200 }}>{notif.message}</td>
                <td style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                  {formatDateFr(notif.start_date)}<br />au {formatDateFr(notif.end_date)}
                </td>
                <td>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "4px 10px", borderRadius: 100, background: notif.active ? "var(--success-bg)" : "var(--neutral-bg)", color: notif.active ? "var(--success)" : "var(--neutral)" }}>
                    {notif.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(notif)}>
                    {notif.active ? "Desactiver" : "Reactiver"}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(notif)}>Supprimer</button>
                </td>
              </tr>
            ))}
            {notifications.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--grey-text)" }}>Aucune notification pour le moment.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {deleteTarget ? (
        <ConfirmModal
          title="Supprimer cette notification ?"
          message={"Supprimer la notification " + deleteTarget.title + " ? Elle ne sera plus visible par les clients."}
          confirmLabel="Supprimer"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          busy={deleting}
        />
      ) : null}
    </AdminLayout>
  )
}
