import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./lib/AuthContext"
import { HomePage } from "./pages/HomePage"
import { ClubSignupPage } from "./pages/ClubSignupPage"
import { PlayerPassPage } from "./pages/PlayerPassPage"
import { AuthPage } from "./pages/AuthPage"
import { AdminDashboardPage } from "./pages/AdminDashboardPage"
import { AdminPlayerPage } from "./pages/AdminPlayerPage"
import { AdminQrCodesPage } from "./pages/AdminQrCodesPage"
import { AdminClubsPage } from "./pages/AdminClubsPage"
import { AdminCouponsPage } from "./pages/AdminCouponsPage"
import { AdminPerformancesPage } from "./pages/AdminPerformancesPage"
import { AdminNotificationsPage } from "./pages/AdminNotificationsPage"
import { OffrePage } from "./pages/OffrePage"
import { ResetPasswordPage } from "./pages/ResetPasswordPage"
import { NewPasswordPage } from "./pages/NewPasswordPage"
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute"

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/club/:slug" element={<ClubSignupPage />} />
          <Route path="/pass/:playerId" element={<PlayerPassPage />} />
          <Route path="/offre/:notifId" element={<OffrePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboardPage /></ProtectedAdminRoute>} />
          <Route path="/admin/player/:playerId" element={<ProtectedAdminRoute><AdminPlayerPage /></ProtectedAdminRoute>} />
          <Route path="/admin/qrcodes" element={<ProtectedAdminRoute><AdminQrCodesPage /></ProtectedAdminRoute>} />
          <Route path="/admin/clubs" element={<ProtectedAdminRoute><AdminClubsPage /></ProtectedAdminRoute>} />
          <Route path="/mot-de-passe-oublie" element={<ResetPasswordPage />} />
          <Route path="/nouveau-mot-de-passe" element={<NewPasswordPage />} />
          <Route path="/admin/notifications" element={<ProtectedAdminRoute><AdminNotificationsPage /></ProtectedAdminRoute>} />
          <Route path="/admin/performances" element={<ProtectedAdminRoute><AdminPerformancesPage /></ProtectedAdminRoute>} />
          <Route path="/admin/coupons" element={<ProtectedAdminRoute><AdminCouponsPage /></ProtectedAdminRoute>} />
          <Route path="*" element={<div className="page-container text-center" style={{ paddingTop: 60 }}><h2>Page introuvable</h2></div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
