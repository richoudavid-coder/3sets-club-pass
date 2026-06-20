import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { Loader } from './Loader'

export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading, isAdmin } = useAuth()

  if (loading) {
    return <Loader label="Vérification de l'accès…" />
  }

  if (!session) {
    return <Navigate to="/auth" replace />
  }

  if (!isAdmin) {
    return (
      <div className="page-container text-center" style={{ paddingTop: 60 }}>
        <h2>Accès réservé</h2>
        <p style={{ color: 'var(--grey-text)', marginTop: 10 }}>
          Ce compte ({profile?.email ?? 'inconnu'}) n'a pas les droits administrateur 3SETS.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
