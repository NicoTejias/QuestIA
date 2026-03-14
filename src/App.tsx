import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
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
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth()
  const user = useQuery(api.users.getProfile, isAuthenticated ? undefined : "skip")
  const location = useLocation()

  // 1. Si Convex aún está verificando si hay sesión, esperamos.
  if (isAuthLoading) return <LoadingScreen />

  // 2. Si definitivamente NO hay sesión, al Login.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Si hay sesión, esperamos a que el perfil llegue de la DB.
  // (Solo esperamos si isAuthenticated es true, para evitar el Loading eterno)
  if (user === undefined) return <LoadingScreen />

  // 4. Si el perfil llegó como null, algo falló, al login.
  if (user === null) return <Navigate to="/login" replace />

  // 5. Verificación de Rol
  const userRole = (user as any)?.role || 'student';

  if (requiredRole && userRole !== requiredRole) {
    const target = userRole === 'teacher' ? '/docente' : '/alumno'
    return <Navigate to={target} replace />
  }

  return <>{children}</>
}

// Componente que redirige a usuarios ya autenticados (Login/Registro)
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth()
  const user = useQuery(api.users.getProfile, isAuthenticated ? undefined : "skip")

  if (isAuthLoading) return <LoadingScreen />

  // Si ya está logueado y tenemos su perfil, lo sacamos de las páginas públicas
  if (isAuthenticated && user) {
    const userRole = (user as any)?.role || 'student';
    const target = userRole === 'teacher' ? '/docente' : '/alumno'
    return <Navigate to={target} replace />
  }

  return <>{children}</>
}

// Redirige al dashboard correcto según el rol del usuario
function DashboardRedirect() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth()
  const user = useQuery(api.users.getProfile, isAuthenticated ? undefined : "skip")

  // 1. Esperar estado de auth
  if (isAuthLoading) return <LoadingScreen />
  
  // 2. Si definitivamente no hay sesión, al login
  if (!isAuthenticated) {
    console.log("DashboardRedirect: No auth session");
    return <Navigate to="/login" replace />
  }

  // 3. Si hay sesión, esperar perfil de DB
  if (user === undefined) return <LoadingScreen />
  
  // 4. Si autenticado pero perfil es null (error de DB)
  if (user === null) {
      console.error("DashboardRedirect: Auth OK but Profile NULL");
      // Si el perfil es null pero está autenticado, es que fue rechazado por el filtro institucional
      return <Navigate to="/auth-error?error=Correo no institucional o perfil no vinculado" replace />
  }

  const userRole = (user as any)?.role || 'student';
  const target = userRole === 'teacher' ? '/docente' : '/alumno'
  
  // Solo redirigir si no estamos ya en el destino (esto evita bucles)
  return <Navigate to={target} replace />
}



import PushNotificationManager from './components/PushNotificationManager'
import UpdateNotification from './components/UpdateNotification'

function App() {

  const { isLoading, isAuthenticated } = useConvexAuth()
  
  useEffect(() => {
    console.log("🚀 DuocencIA v1.0.3 - Auth State:", { isLoading, isAuthenticated });
  }, [isLoading, isAuthenticated]);

  return (
    <>
      <PushNotificationManager />
      <UpdateNotification />
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
