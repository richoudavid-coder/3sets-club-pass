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
        pré-remplis.
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
