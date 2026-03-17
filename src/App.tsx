import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useConvexAuth } from "convex/react"
import { useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import { Loader2, Sparkles, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
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
  const isSimulating = localStorage.getItem('quest_simulate_student') === 'true';

  // Permitir que docentes/admins simulen ser alumnos
  const canAccessAsStudent = requiredRole === 'student' && 
    (userRole === 'student' || (isSimulating && (userRole === 'teacher' || userRole === 'admin')));

  if (requiredRole && !canAccessAsStudent && userRole !== requiredRole) {
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
  const [isStuck, setIsStuck] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
        if (!isAuthLoading && isAuthenticated && user === undefined) {
            setIsStuck(true)
        }
    }, 5000)
    return () => clearTimeout(timer)
  }, [isAuthLoading, isAuthenticated, user])

  console.log("🛠️ DashboardRedirect State:", { isAuthLoading, isAuthenticated, userExists: user !== undefined, userProfile: user });

  // 1. Esperar estado de auth
  if (isAuthLoading) return <LoadingScreen />
  
  // 2. Si definitivamente no hay sesión, al login
  if (!isAuthenticated) {
    console.warn("DashboardRedirect: No auth session, redirecting to login");
    return <Navigate to="/login" replace />
  }

  // 3. Si hay sesión, esperar perfil de DB
  if (user === undefined) {
    console.log("DashboardRedirect: Waiting for user profile from Convex...");
    if (isStuck) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
                <ShieldAlert className="w-16 h-16 text-amber-500 mb-4" />
                <h1 className="text-xl font-bold text-white mb-2">Conexión Lenta o Error de Perfil</h1>
                <p className="text-slate-400 text-sm mb-6">Estamos teniendo problemas para cargar tu perfil de Quest. Prueba cerrando sesión e ingresando de nuevo.</p>
                <div className="space-y-3 w-full max-w-xs">
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full bg-white/10 text-white font-bold py-3 rounded-xl border border-white/5"
                    >
                        Reintentar
                    </button>
                    <button 
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = '/login';
                        }}
                        className="w-full bg-red-500/20 text-red-500 font-bold py-3 rounded-xl border border-red-500/20"
                    >
                        Cerrar Sesión Forzado
                    </button>
                </div>
            </div>
        )
    }
    return <LoadingScreen />
  }
  
  // 4. Si autenticado pero perfil es null (error de DB)
  if (user === null) {
      console.error("DashboardRedirect: Auth OK but Profile NULL - Verification failure");
      return <Navigate to="/auth-error?error=Perfil no encontrado o correo no institucional" replace />
  }

  const userRole = (user as any)?.role || 'student';
  const target = userRole === 'teacher' ? '/docente' : '/alumno'
  
  console.log("✅ DashboardRedirect: Success! Target:", target);
  return <Navigate to={target} replace />
}



import PushNotificationManager from './components/PushNotificationManager'
import UpdateNotification from './components/UpdateNotification'
import FeedbackButton from './components/FeedbackButton'

function App() {

  const { isLoading, isAuthenticated } = useConvexAuth()
  
  useEffect(() => {
    console.log("🚀 Quest v1.0.11 - Auth State:", { isLoading, isAuthenticated });
  }, [isLoading, isAuthenticated]);

  return (
    <>
      <PushNotificationManager />
      <UpdateNotification />
      <FeedbackButton />
      {localStorage.getItem('quest_simulate_student') === 'true' && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-black px-4 py-2 flex items-center justify-between text-xs font-black shadow-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>ESTÁS EN MODO PRUEBA (ALUMNO) - LOS DATOS NO SE GUARDARÁN</span>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('quest_simulate_student');
              window.location.href = '/docente';
            }}
            className="bg-black hover:bg-slate-900 text-white px-3 py-1 rounded-full text-center transition-all"
          >
            VOLVER A DOCENTE
          </button>
        </div>
      )}
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
