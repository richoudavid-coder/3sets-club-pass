import { useEffect, useRef, useState, type FormEvent } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { AdminLayout } from './AdminLayout'
import { Loader } from '../components/Loader'
import { ConfirmModal } from '../components/ConfirmModal'
import { supabase, APP_URL } from '../lib/supabase'
import { slugify } from '../lib/slugify'
import { SPORT_LABELS, type Club, type Sport } from '../types'

export function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const wrapRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Formulaire de création
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [sport, setSport] = useState<Sport>('tennis')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Confirmation de suppression
  const [deleteTarget, setDeleteTarget] = useState<Club | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function loadClubs() {
    setLoading(true)
    const { data } = await supabase.from('clubs').select('*').order('name', { ascending: true })
    setClubs((data ?? []) as Club[])
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
    return `${APP_URL.replace(/\/$/, '')}/club/${clubSlug}`
  }

  function handleDownload(clubSlug: string) {
    const canvas = wrapRefs.current[clubSlug]?.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `qrcode-${clubSlug}.png`
    link.click()
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

    const { error: insertError } = await supabase.from('clubs').insert({
      name: cleanName,
      slug: cleanSlug,
      sport,
      active: true,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Cet identifiant (slug) est déjà utilisé par un autre club. Choisis-en un différent.')
      } else {
        setError("Une erreur est survenue lors de la création du club. Réessaie dans un instant.")
      }
      setSubmitting(false)
      return
    }

    setFeedback(`Club "${cleanName}" créé avec succès. Son QR code est prêt ci-dessous.`)
    setName('')
    setSlug('')
    setSlugManuallyEdited(false)
    setSubmitting(false)
    await loadClubs()
  }

  async function toggleActive(club: Club) {
    setFeedback(null)
    await supabase.from('clubs').update({ active: !club.active }).eq('id', club.id)
    await loadClubs()
  }

  async function handleDeleteClub() {
    if (!deleteTarget) return
    setDeleting(true)

    const { error: deleteError } = await supabase.from('clubs').delete().eq('id', deleteTarget.id)

    if (deleteError) {
      setError("Impossible de supprimer ce club pour le moment. Réessaie dans un instant.")
    } else {
      setFeedback(`Club "${deleteTarget.name}" supprimé, ainsi que ses joueurs et coupons associés.`)
    }

    setDeleteTarget(null)
    setDeleting(false)
    await loadClubs()
  }

  if (loading) {
    return (
      <AdminLayout>
        <Loader label="Chargement des clubs…" />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div
cat > src/pages/AdminQrCodesPage.tsx << 'EOF'
import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { AdminLayout } from './AdminLayout'
import { Loader } from '../components/Loader'
import { supabase } from '../lib/supabase'
import { APP_URL } from '../lib/supabase'
import { SPORT_LABELS, type Club } from '../types'

export function AdminQrCodesPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const wrapRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('clubs').select('*').order('name', { ascending: true })
      setClubs((data ?? []) as Club[])
      setLoading(false)
    }
    load()
  }, [])

  function buildUrl(slug: string) {
    return `${APP_URL.replace(/\/$/, '')}/club/${slug}`
  }

  function handleDownload(slug: string) {
    const canvas = wrapRefs.current[slug]?.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `qrcode-${slug}.png`
    link.click()
  }

  if (loading) {
    return (
      <AdminLayout>
        <Loader label="Chargement des clubs…" />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <h1>QR codes clubs</h1>
      </div>

      <p style={{ color: 'var(--grey-text)', marginBottom: 20, fontSize: '0.9rem' }}>
        Imprime ces QR codes et affiche-les dans chaque club partenaire. Une fois scannés, ils
        amènent directement le joueur sur sa page d'inscription, club et sport déjà
        pré-remplis. Pour ajouter, désactiver ou supprimer un club, va dans{' '}
        <a href="/admin/clubs" style={{ color: 'var(--navy)', fontWeight: 700 }}>
          Gestion des clubs
        </a>
        .
      </p>

      <div className="qr-grid">
        {clubs.map((club) => {
          const url = buildUrl(club.slug)
          return (
            <div className="qr-card" key={club.id}>
              <div className="qr-card__sport">{SPORT_LABELS[club.sport]}</div>
              <div className="qr-card__name">{club.name}</div>
              <div
                className="qr-card__canvas-wrap"
                ref={(el) => {
                  wrapRefs.current[club.slug] = el
                }}
              >
                <QRCodeCanvas value={url} size={160} level="M" />
              </div>
              <div className="qr-card__url">{url}</div>
              <button
                className="btn btn-secondary btn-sm btn-block"
                onClick={() => handleDownload(club.slug)}
              >
                Télécharger le PNG
              </button>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
