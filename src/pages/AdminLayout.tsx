import type { ReactNode } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { BrandHeader } from "../components/BrandHeader"
import { useAuth } from "../lib/AuthContext"

export function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate("/auth")
  }

  return (
    <div className="app-shell">
      <BrandHeader
        wide
        tagline="Espace vendeur 3SETS"
        actions={
          <>
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.82rem", marginRight: 4 }}>
              {profile?.email}
            </span>
            <button className="btn btn-ghost-light btn-sm" onClick={handleSignOut}>
              Déconnexion
            </button>
          </>
        }
      />
      <div className="admin-content">
        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? "active" : "")}>
            Tableau de bord
          </NavLink>
          <NavLink to="/admin/notifications" className={({ isActive }) => (isActive ? "active" : "")}>
            Notifications
          </NavLink>
          <NavLink to="/admin/performances" className={({ isActive }) => (isActive ? "active" : "")}>
            Performances
          </NavLink>
          <NavLink to="/admin/coupons" className={({ isActive }) => (isActive ? "active" : "")}>
            Coupons
          </NavLink>
          <NavLink to="/admin/clubs" className={({ isActive }) => (isActive ? "active" : "")}>
            Clubs
          </NavLink>
          <NavLink to="/admin/qrcodes" className={({ isActive }) => (isActive ? "active" : "")}>
            QR codes
          </NavLink>
        </nav>
        {children}
      </div>
    </div>
  )
}
