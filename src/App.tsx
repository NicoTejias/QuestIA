import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useConvexAuth } from "convex/react"
import { useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import { Loader2 } from 'lucide-react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import BelbinTest from './pages/BelbinTest'
import RewardStorePage from './pages/RewardStorePage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'
import AuthErrorPage from './pages/AuthErrorPage'
import { Toaster } from 'sonner'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Cargando...</p>
      </div>
    </div>
  )
}

// Componente que protege rutas que requieren autenticación
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useQuery(api.users.getProfile, isAuthenticated ? undefined : "skip")
  const location = useLocation()

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />

  // Wait for profile
  if (user === undefined) return <LoadingScreen />

  if (user === null) {
    if (location.pathname !== "/login") {
      return <Navigate to="/login" replace />
    }
    return <>{children}</>
  }

  const userRole = (user as any)?.role || 'student';

  // Si se requiere un rol específico, verificar
  if (requiredRole && userRole !== requiredRole) {
    const target = userRole === 'teacher' ? '/docente' : '/alumno'

    if (location.pathname !== target) {
      return <Navigate to={target} replace />
    }
  }

  return <>{children}</>
}

// Componente que redirige a usuarios ya autenticados
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useQuery(api.users.getProfile, isAuthenticated ? undefined : "skip")
  const location = useLocation()

  if (isLoading) return <LoadingScreen />

  // If user is logged in, redirect them away from public pages *if* we know where they should go
  if (isAuthenticated && user) {
    const userRole = (user as any)?.role || 'student';
    const target = userRole === 'teacher' ? '/docente' : '/alumno'
    if (location.pathname !== target) {
      return <Navigate to={target} replace />
    }
  }

  return <>{children}</>
}

// Redirige al dashboard correcto según el rol del usuario
function DashboardRedirect() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useQuery(api.users.getProfile)

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (user === undefined) return <LoadingScreen />
  if (user === null) return <Navigate to="/login" replace />

  const userRole = (user as any)?.role || 'student';
  const target = userRole === 'teacher' ? '/docente' : '/alumno'
  return <Navigate to={target} replace />
}



function App() {
  return (
    <>

      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        } />

        <Route path="/registro" element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        } />

        <Route path="/alumno" element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />

        <Route path="/docente" element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        } />

        <Route path="/test-belbin" element={
          <ProtectedRoute>
            <BelbinTest />
          </ProtectedRoute>
        } />

        <Route path="/tienda/:courseId" element={
          <ProtectedRoute>
            <RewardStorePage />
          </ProtectedRoute>
        } />

        <Route path="/perfil" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />


        {/* Ruta inteligente que redirige al dashboard correcto según el rol */}
        <Route path="/dashboard" element={
          <DashboardRedirect />
        } />

        {/* Ruta para manejar errores de autenticación */}
        <Route path="/auth-error" element={<AuthErrorPage />} />

        {/* 404 Catch-all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="top-right" theme="dark" richColors />
    </>
  )
}

export default App
