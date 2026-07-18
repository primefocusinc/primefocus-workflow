import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading your account...</div>
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}
