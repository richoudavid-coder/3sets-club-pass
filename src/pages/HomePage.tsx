import { Link } from 'react-router-dom'
import { BrandHeader } from '../components/BrandHeader'

export function HomePage() {
  return (
    <div className="app-shell">
      <BrandHeader tagline="Coupons licenciés clubs partenaires" />
      <div className="page-container text-center" style={{ paddingTop: 50 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 14 }}>Bienvenue sur 3SETS Club Pass</h1>
        <p style={{ color: 'var(--grey-text)', maxWidth: 420, margin: '0 auto 28px' }}>
          Scanne le QR code affiché dans ton club partenaire pour t'inscrire et débloquer tes
          coupons 3SETS. Cette page d'accueil n'est pas destinée à une utilisation directe par les
          joueurs.
        </p>
        <Link to="/auth" className="btn btn-secondary">
          Espace vendeur 3SETS
        </Link>
      </div>
    </div>
  )
}
