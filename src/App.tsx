import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute'
import { Loader } from './components/Loader'

function lazyNamed<T extends ComponentType<any>>(loader: () => Promise<Record<string, T>>, name: string) {
  return lazy(async () => ({ default: (await loader())[name] }))
}

const HomePage = lazyNamed(() => import('./pages/HomePage'), 'HomePage')
const ClubSignupPage = lazyNamed(() => import('./pages/ClubSignupPage'), 'ClubSignupPage')
const PlayerPassPage = lazyNamed(() => import('./pages/PlayerPassPage'), 'PlayerPassPage')
const OffrePage = lazyNamed(() => import('./pages/OffrePage'), 'OffrePage')
const AuthPage = lazyNamed(() => import('./pages/AuthPage'), 'AuthPage')
const ResetPasswordPage = lazyNamed(() => import('./pages/ResetPasswordPage'), 'ResetPasswordPage')
const NewPasswordPage = lazyNamed(() => import('./pages/NewPasswordPage'), 'NewPasswordPage')
const AdminDashboardPage = lazyNamed(() => import('./pages/AdminDashboardPage'), 'AdminDashboardPage')
const AdminPlayerPage = lazyNamed(() => import('./pages/AdminPlayerPage'), 'AdminPlayerPage')
const AdminQrCodesPage = lazyNamed(() => import('./pages/AdminQrCodesPage'), 'AdminQrCodesPage')
const AdminClubsPage = lazyNamed(() => import('./pages/AdminClubsPage'), 'AdminClubsPage')
const AdminCouponsPage = lazyNamed(() => import('./pages/AdminCouponsPage'), 'AdminCouponsPage')
const AdminPerformancesPage = lazyNamed(() => import('./pages/AdminPerformancesPage'), 'AdminPerformancesPage')
const AdminNotificationsPage = lazyNamed(() => import('./pages/AdminNotificationsPage'), 'AdminNotificationsPage')

const admin = (page: ReactNode) => <ProtectedAdminRoute>{page}</ProtectedAdminRoute>

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Loader label="Chargement…" />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/club/:slug" element={<ClubSignupPage />} />
            <Route path="/pass/:playerId" element={<PlayerPassPage />} />
            <Route path="/offre/:notifId" element={<OffrePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/mot-de-passe-oublie" element={<ResetPasswordPage />} />
            <Route path="/nouveau-mot-de-passe" element={<NewPasswordPage />} />
            <Route path="/admin" element={admin(<AdminDashboardPage />)} />
            <Route path="/admin/player/:playerId" element={admin(<AdminPlayerPage />)} />
            <Route path="/admin/qrcodes" element={admin(<AdminQrCodesPage />)} />
            <Route path="/admin/clubs" element={admin(<AdminClubsPage />)} />
            <Route path="/admin/coupons" element={admin(<AdminCouponsPage />)} />
            <Route path="/admin/performances" element={admin(<AdminPerformancesPage />)} />
            <Route path="/admin/notifications" element={admin(<AdminNotificationsPage />)} />
            <Route path="*" element={<div className="page-container text-center" style={{ paddingTop: 60 }}><h2>Page introuvable</h2></div>} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
