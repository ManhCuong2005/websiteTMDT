import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  return user ? children : <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />
}

export function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/dang-nhap" replace />
  return user.role === 'ADMIN' ? children : <Navigate to="/" replace />
}
