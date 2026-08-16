import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import ClubDashboard from './pages/ClubDashboard'
import UserDashboard from './pages/UserDashboard'
import useAuth from './hooks/useAuth'

function App() {
  const auth = useAuth()

  const normalizedRole = String(auth.role || '').toUpperCase()
  const dashboardPath = normalizedRole === 'CLUB' ? '/club' : '/user'

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate to={auth.isAuthenticated ? dashboardPath : '/auth'} replace />
          }
        />
        <Route
          path="/auth"
          element={
            auth.isAuthenticated ? (
              <Navigate to={dashboardPath} replace />
            ) : (
              <AuthPage onLoginSuccess={auth.setToken} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <Navigate to={auth.isAuthenticated ? dashboardPath : '/auth'} replace />
          }
        />
        <Route
          path="/club"
          element={
            auth.isAuthenticated ? (
              normalizedRole === 'CLUB' ? (
                <ClubDashboard onLogout={auth.logout} />
              ) : (
                <Navigate to="/user" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/user"
          element={
            auth.isAuthenticated ? (
              normalizedRole === 'USER' ? (
                <UserDashboard onLogout={auth.logout} />
              ) : (
                <Navigate to="/club" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
