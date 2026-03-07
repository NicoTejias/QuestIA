import { Routes, Route, Navigate } from 'react-router-dom'
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
  const user = useQuery(api.users.me)

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Si se requiere un rol específico, verificar
  if (requiredRole && user && user.role !== requiredRole) {
    return <Navigate to={user.role === 'teacher' ? '/docente' : '/alumno'} replace />
  }

  return <>{children}</>
}

// Componente que redirige a usuarios ya autenticados
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useQuery(api.users.me, isAuthenticated ? undefined : "skip")

  if (isLoading) return <LoadingScreen />

  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'teacher' ? '/docente' : '/alumno'} replace />
  }

  return <>{children}</>
}

// Redirige al dashboard correcto según el rol del usuario
function DashboardRedirect() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useQuery(api.users.me, isAuthenticated ? undefined : "skip")

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Esperar a que se cargue el usuario
  if (!user) return <LoadingScreen />

  return <Navigate to={user.role === 'teacher' ? '/docente' : '/alumno'} replace />
}

function App() {
  return (
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

      {/* Ruta inteligente que redirige al dashboard correcto según el rol */}
      <Route path="/dashboard" element={
        <DashboardRedirect />
      } />
    </Routes>
  )
}

export default App
