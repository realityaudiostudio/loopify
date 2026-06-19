import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

/* Pages */
import LoginPage           from './pages/LoginPage'
import SignupPage          from './pages/SignupPage'
import DashboardPage       from './pages/DashboardPage'
import ProfilePage         from './pages/ProfilePage'
import ProductDetailPage   from './pages/ProductDetailPage'
import RentNowPage         from './pages/RentNowPage'
import RentalsPage         from './pages/RentalsPage'
import WalletPage          from './pages/WalletPage'
import PlaceholderPage     from './pages/PlaceholderPage'

/** Redirect logged-in users away from /login → /dashboard */
function GuestRoute({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ── Auth (guest-only) ── */}
          <Route
            path="/login"
            element={<GuestRoute><LoginPage /></GuestRoute>}
          />
          <Route path="/signup"          element={<GuestRoute><SignupPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<PlaceholderPage title="Forgot Password" />} />
          <Route path="/verify"          element={<PlaceholderPage title="Verify Email" />} />

          {/* ── Protected (auth required) ── */}
          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/rentals"
            element={<ProtectedRoute><RentalsPage /></ProtectedRoute>}
          />
          <Route
            path="/rent/:id"
            element={<ProtectedRoute><RentNowPage /></ProtectedRoute>}
          />
          <Route
            path="/queue"
            element={<ProtectedRoute><PlaceholderPage title="Queue Status" /></ProtectedRoute>}
          />
          <Route
            path="/wallet"
            element={<ProtectedRoute><WalletPage /></ProtectedRoute>}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
          />
          <Route
            path="/products"
            element={<ProtectedRoute><PlaceholderPage title="Products" /></ProtectedRoute>}
          />
          <Route
            path="/products/:id"
            element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>}
          />
          <Route
            path="/notifications"
            element={<ProtectedRoute><PlaceholderPage title="Notifications" /></ProtectedRoute>}
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
