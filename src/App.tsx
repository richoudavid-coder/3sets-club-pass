import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import { HomePage } from './pages/HomePage'
import { ClubSignupPage } from './pages/ClubSignupPage'
import { PlayerPassPage } from './pages/PlayerPassPage'
import { AuthPage } from './pages/AuthPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminPlayerPage } from './pages/AdminPlayerPage'
import { AdminQrCodesPage } from './pages/AdminQrCodesPage'
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/club/:slug" element={<ClubSignupPage />} />
          <Route path="/pass/:playerId" element={<PlayerPassPage />} />
          <Route path="/auth" element={<AuthPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboardPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/player/:playerId"
            element={
              <ProtectedAdminRoute>
                <AdminPlayerPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/qrcodes"
            element={
              <ProtectedAdminRoute>
                <AdminQrCodesPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="*"
            element={
              <div className="page-container text-center" style={{ paddingTop: 60 }}>
                <h2>Page introuvable</h2>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
