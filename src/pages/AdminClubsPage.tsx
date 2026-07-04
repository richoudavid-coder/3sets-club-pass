import { useEffect, useState, type FormEvent } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { AdminLayout } from "./AdminLayout"
import { Loader } from "../components/Loader"
import { ConfirmModal } from "../components/ConfirmModal"
import { supabase, APP_URL } from "../lib/supabase"
import { slugify } from "../lib/slugify"
import { SPORT_LABELS } from "../types"

const ALL_SPORTS = ["tennis", "badminton", "padel", "tennis-de-table"]

function downloadQrCode(containerId: string, fileName: string) {
  const container = document.getElementById(containerId)
  const canvas = container ? container.querySelector("canvas") : null
  if (!canvas) return
  const url = canvas.toDataURL("image/png")
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
}

export function AdminClubsPage() {
  const [clubs, setClubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [selectedSports, setSelectedSports] = useState<string[]>(["tennis"])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)
  const [editingClub, setEditingClub] = useState<any>(null)
  const [editSports, setEditSports] = useState<string[]>([])
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)

  async function loadClubs() {
    setLoading(true)
    const result = await supabase
      .from("clubs").select("*")
      .order("sport", { ascending: true })
      .order("name", { ascending: true })
    setClubs(result.data || [])
    setLoading(false)
  }

  useEffect(() => { loadClubs() }, [])

  function handleNameChange(value: string) {
    setName(value)
    if (!slugManuallyEdited) setSlug(slugify(value))
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true)
    setSlug(slugify(value))
  }

  function toggleSport(sport: string) {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    )
  }

  function buildUrl(clubSlug: string) {
    return APP_URL.replace(/\/$/, "") + "/club/" + clubSlug
  }

  async function handleCreateClub(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFeedback(null)
    const cleanName = name.trim()
    const cleanSlug = slugify(slug)
    if (!cleanName || !cleanSlug) {
      setError("Merci de renseigner un nom et un identifiant.")
      return
    }
    if (selectedSports.length === 0) {
      setError("Merci de selectionner au moins un sport.")
      return
    }
    setSubmitting(true)
    const { error: insertError } = await supabase.from("clubs").insert({
      name: cleanName,
      slug: cleanSlug,
      sport: selectedSports[0],
      sports: selectedSports,
      active: true,
    })
    if (insertError) {
      if (insertError.code === "23505") {
        setError("Cet identifiant est déjà utilise. Choisis-en un different.")
      } else {
        setError("Erreur lors de la creation du club.")
      }
      setSubmitting(false)
      return
    }
    setFeedback("Club " + cleanName + " créé avec succès.")
    setName("")
    setSlug("")
    setSlugManuallyEdited(false)
    setSelectedSports(["tennis"])
    setSubmitting(false)
    loadClubs()
  }

  async function toggleActive(club: any) {
    setFeedback(null)
    await supabase.from("clubs").update({ active: !club.active }).eq("id", club.id)
    loadClubs()
  }

  function startEditClub(club: any) {
    setEditingClub(club)
    setEditName(club.name)
    setEditSports(club.sports && club.sports.length > 0 ? club.sports : [club.sport])
  }

  async function handleSaveClub() {
    if (!editingClub) return
    if (editSports.length === 0) { setError("Selectionne au moins un sport."); return }
    setSaving(true)
    const { error: updateError } = await supabase.from("clubs").update({
      name: editName.trim(),
      sport: editSports[0],
      sports: editSports,
    }).eq("id", editingClub.id)
    if (updateError) {
      setError("Erreur lors de la modification.")
    } else {
      setFeedback("Club modifie avec succès.")
      setEditingClub(null)
    }
    setSaving(false)
    loadClubs()
  }

  async function handleDeleteClub() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error: deleteError } = await supabase.from("clubs").delete().eq("id", deleteTarget.id)
    if (deleteError) {
      setError("Impossible de supprimer ce club.")
    } else {
      setFeedback("Club " + deleteTarget.name + " supprime.")
    }
    setDeleteTarget(null)
    setDeleting(false)
    loadClubs()
  }

  if (loading) return <AdminLayout><Loader label="Chargement des clubs..." /></AdminLayout>

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <h1>Gestion des clubs</h1>
      </div>

      {feedback ? <div className="form-succèss-banner">{feedback}</div> : null}

      <div className="card mt-24">
        <h3 className="section-title">Ajouter un nouveau club</h3>
        <form onSubmit={handleCreateClub}>
          {error ? <div className="form-error-banner">{error}</div> : null}
          <div className="field">
            <label>Nom du club</label>
            <input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Tennis Club de Plouzane" />
          </div>
          <div className="field">
            <label>Identifiant URL (slug)</label>
            <input value={slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="tc-plouzane" />
            <div className="field-hint">URL : {buildUrl(slug || "...")}</div>
          </div>
          <div className="field">
            <label>Sports proposés (cochez tout ce qui s'applique)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {ALL_SPORTS.map((sp) => (
                <label key={sp} style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 400, cursor: "pointer", fontSize: "0.95rem" }}>
                  <input
                    type="checkbox"
                    checked={selectedSports.includes(sp)}
                    onChange={() => toggleSport(sp)}
                    style={{ width: 18, height: 18, accentColor: "var(--orange)", flexShrink: 0 }}
                  />
                  {SPORT_LABELS[sp as keyof typeof SPORT_LABELS]}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Création en cours..." : "Créér le club"}
          </button>
        </form>
      </div>

      <h3 className="section-title mt-24">Clubs existants ({clubs.length})</h3>

      <div className="qr-grid">
        {clubs.map((club) => {
          const url = buildUrl(club.slug)
          const containerId = "qr-" + club.id
          const clubSports = club.sports && club.sports.length > 0 ? club.sports : [club.sport]
          return (
            <div className="qr-card" key={club.id} style={{ opacity: club.active ? 1 : 0.55 }}>
              <div className="qr-card__sport">
                {clubSports.map((s: string) => SPORT_LABELS[s as keyof typeof SPORT_LABELS]).join(" · ")}
              </div>
              <div className="qr-card__name">{club.name}</div>
              {!club.active ? (
                <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--danger)", marginBottom: 10, textTransform: "uppercase" }}>
                  Desactive
                </div>
              ) : null}
              <div className="qr-card__canvas-wrap" id={containerId}>
                <QRCodeCanvas value={url} size={140} level="M" />
              </div>
              <div className="qr-card__url">{url}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="btn btn-secondary btn-sm btn-block" onClick={() => downloadQrCode(containerId, "qrcode-" + club.slug + ".png")}>
                  Télécharger le PNG
                </button>
                <button className="btn btn-secondary btn-sm btn-block" onClick={() => startEditClub(club)}>
                  Modifier
                </button>
                <button className="btn btn-secondary btn-sm btn-block" onClick={() => toggleActive(club)}>
                  {club.active ? "Désactiver" : "Réactiver"}
                </button>
                <button className="btn btn-danger btn-sm btn-block" onClick={() => setDeleteTarget(club)}>
                  Supprimer
                </button>
              </div>
            </div>
          )
        })}
        {clubs.length === 0 ? (
          <div className="empty-state">Aucun club pour le moment.</div>
        ) : null}
      </div>

      {editingClub ? (
        <div className="modal-overlay" onClick={() => setEditingClub(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <h3>Modifier le club</h3>
            {error ? <div className="form-error-banner">{error}</div> : null}
            <div className="field">
              <label>Nom du club</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="field">
              <label>Sports proposés</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                {ALL_SPORTS.map((sp) => (
                  <label key={sp} style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 400, cursor: "pointer", fontSize: "0.95rem" }}>
                    <input
                      type="checkbox"
                      checked={editSports.includes(sp)}
                      onChange={() => setEditSports((prev) => prev.includes(sp) ? prev.filter((s) => s !== sp) : [...prev, sp])}
                      style={{ width: 18, height: 18, accentColor: "var(--orange)", flexShrink: 0 }}
                    />
                    {SPORT_LABELS[sp as keyof typeof SPORT_LABELS]}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditingClub(null)} disabled={saving}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSaveClub} disabled={saving}>
                {saving ? "Sauvegarde..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {deleteTarget ? (
        <ConfirmModal
          title="Supprimer ce club ?"
          message={"Confirmer la suppression de " + deleteTarget.name + " ? Tous les joueurs et coupons associes seront supprimes. Action irreversible."}
          confirmLabel="Supprimer définitivement"
          onConfirm={handleDeleteClub}
          onCancel={() => setDeleteTarget(null)}
          busy={deleting}
        />
      ) : null}
    </AdminLayout>
  )
}
