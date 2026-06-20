import { useEffect, useState, type FormEvent } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { AdminLayout } from './AdminLayout'
import { Loader } from '../components/Loader'
import { ConfirmModal } from '../components/ConfirmModal'
import { supabase, APP_URL } from '../lib/supabase'
import { slugify } from '../lib/slugify'
import { SPORT_LABELS, type Club, type Sport } from '../types'

function downloadQrCode(containerId: string, fileName: string) {
  const container = document.getElementById(containerId)
  const canvas = container ? container.querySelector('canvas') : null
  if (!canvas) return
  const url = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
}

export function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [sport, setSport] = useState<Sport>('tennis')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Club | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function loadClubs() {
    setLoading(true)
    const result = await supabase.from('clubs').select('*').order('name', { ascending: true })
    setClubs((result.data || []) as Club[])
    setLoading(false)
  }

  useEffect(() => {
    loadClubs()
  }, [])

  function handleNameChange(value: string) {
    setName(value)
    if (!slugManuallyEdited) {
      setSlug(slugify(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true)
    setSlug(slugify(value))
  }

  function buildUrl(clubSlug: string) {
    return APP_URL.replace(/\/$/, '') + '/club/' + clubSlug
  }

  async function handleCreateClub(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFeedback(null)

    const cleanName = name.trim()
    const cleanSlug = slugify(slug)

    if (!cleanName || !cleanSlug) {
      setError('Merci de renseigner un nom de club et un identifiant (slug).')
      return
    }

    setSubmitting(true)

    const result = await supabase.from('clubs').insert({
      name: cleanName,
      slug: cleanSlug,
      sport: sport,
      active: true,
    })

    if (result.error) {
      if (result.error.code === '23505') {
        setError('Cet identifiant (slug) est deja utilise par un autre club. Choisis-en un different.')
      } else {
        setError('Une erreur est survenue lors de la creation du club. Reessaie dans un instant.')
      }
      setSubmitting(false)
      return
    }

    setFeedback('Club "' + cleanName + '" cree avec succes. Son QR code est pret ci-dessous.')
    setName('')
    setSlug('')
    setSlugManuallyEdited(false)
    setSubmitting(false)
    loadClubs()
  }

  async function toggleActive(club: Club) {
    setFeedback(null)
    await supabase.from('clubs').update({ active: !club.active }).eq('id', club.id)
    loadClubs()
  }

  async function handleDeleteClub() {
    if (!deleteTarget) return
    setDeleting(true)

    const result = await supabase.from('clubs').delete().eq('id', deleteTarget.id)

    if (result.error) {
      setError('Impossible de supprimer ce club pour le moment. Reessaie dans un instant.')
    } else {
      setFeedback('Club "' + deleteTarget.name + '" supprime, ainsi que ses joueurs et coupons associes.')
    }

    setDeleteTarget(null)
    setDeleting(false)
    loadClubs()
  }

  if (loading) {
    return (
      <AdminLayout>
        <Loader label="Chargement des clubs..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <h1>Gestion des clubs</h1>
      </div>

      {feedback ? <div className="form-success-banner">{feedback}</div> : null}

      <div className="card mt-24">
        <h3 className="section-title">Ajouter un nouveau club</h3>

        <form onSubmit={handleCreateClub}>
          {error ? <div className="form-error-banner">{error}</div> : null}

          <div className="field">
            <label>Nom du club</label>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Tennis Club de Plouzane"
            />
          </div>

          <div className="field">
            <label>Identifiant URL (slug)</label>
            <input
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="tc-plouzane"
            />
            <div className="field-hint">
              Genere automatiquement depuis le nom. Utilise dans l adresse : {buildUrl(slug || '...')}
            </div>
          </div>

          <div className="field">
            <label>Sport</label>
            <select value={sport} onChange={(e) => setSport(e.target.value as Sport)}>
              {Object.keys(SPORT_LABELS).map((key) => (
                <option key={key} value={key}>
                  {SPORT_LABELS[key as Sport]}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creation en cours...' : 'Creer le club'}
          </button>
        </form>
      </div>

      <h3 className="section-title mt-24">Clubs existants ({clubs.length})</h3>

      <div className="qr-grid">
        {clubs.map((club) => {
          const url = buildUrl(club.slug)
          const containerId = 'qr-' + club.id
          return (
            <div className="qr-card" key={club.id} style={{ opacity: club.active ? 1 : 0.55 }}>
              <div className="qr-card__sport">{SPORT_LABELS[club.sport]}</div>
              <div className="qr-card__name">{club.name}</div>

              {!club.active ? (
                <div
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: 'var(--danger)',
                    marginBottom: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Desactive
                </div>
              ) : null}

              <div className="qr-card__canvas-wrap" id={containerId}>
                <QRCodeCanvas value={url} size={140} level="M" />
              </div>
              <div className="qr-card__url">{url}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm btn-block"
                  onClick={() => downloadQrCode(containerId, 'qrcode-' + club.slug + '.png')}
                >
                  Telecharger le PNG
                </button>
                <button
                  className="btn btn-secondary btn-sm btn-block"
                  onClick={() => toggleActive(club)}
                >
                  {club.active ? 'Desactiver' : 'Reactiver'}
                </button>
                <button
                  className="btn btn-danger btn-sm btn-block"
                  onClick={() => setDeleteTarget(club)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          )
        })}

        {clubs.length === 0 ? (
          <div className="empty-state">Aucun club pour le moment. Cree le premier ci-dessus.</div>
        ) : null}
      </div>

      {deleteTarget ? (
        <ConfirmModal
          title="Supprimer ce club ?"
          message={'Confirmer la suppression de "' + deleteTarget.name + '" ? Tous les joueurs inscrits a ce club et leurs coupons seront egalement supprimes definitivement. Cette action est irreversible.'}
          confirmLabel="Supprimer definitivement"
          onConfirm={handleDeleteClub}
          onCancel={() => setDeleteTarget(null)}
          busy={deleting}
        />
      ) : null}
    </AdminLayout>
  )
}
