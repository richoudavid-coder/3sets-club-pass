import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface BrandHeaderProps {
  wide?: boolean
  tagline?: string
  actions?: ReactNode
}

/**
 * En-tête de marque réutilisable.
 * Le logo est actuellement un placeholder texte stylisé "3SETS".
 * Pour intégrer un vrai logo plus tard : remplace le contenu de <Link className="brand-logo" style={{ fontFamily: "'Bebas Neue', system-ui", letterSpacing: "0.04em", fontSize: "2rem" }}>
 * par une balise <img src="/logo.svg" alt="3SETS" height={32} /> (place le fichier dans /public).
 */
export function BrandHeader({ wide, tagline, actions }: BrandHeaderProps) {
  return (
    <header className={`brand-header ${wide ? 'brand-header--wide' : ''}`}>
      <div className="brand-header__inner">
        <div>
          <Link to="/" className="brand-logo" style={{ fontFamily: "'Bebas Neue', system-ui", letterSpacing: "0.04em", fontSize: "2rem" }}>
            <img src="/logo-white.svg" alt="3SETS" style={{height:36,display:"block"}} />
            <small>Club Pass</small>
          </Link>
          {tagline && <div className="brand-tag">{tagline}</div>}
        </div>
        {actions && <div className="header-actions">{actions}</div>}
      </div>
    </header>
  )
}
