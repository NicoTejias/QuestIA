import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useConvexAuth, useQuery } from 'convex/react'
import { api } from "../convex/_generated/api"
import { Loader2 } from 'lucide-react'
import { Toaster } from 'sonner'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthErrorPage from './pages/AuthErrorPage'
import PushNotificationManager from './components/PushNotificationManager'
import UpdateNotification from './components/UpdateNotification'
import FeedbackButton from './components/FeedbackButton'
import CookieConsent from './components/CookieConsent'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicOnlyRoute from './components/auth/PublicOnlyRoute'
import DashboardRedirect from './components/auth/DashboardRedirect'
import ErrorBoundary from './components/ErrorBoundary'

const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'))
const BelbinTest = lazy(() => import('./pages/BelbinTest'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

function App() {
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.users.getProfile, isAuthenticated ? undefined : "skip")
  const isTeacher = user && (user.role === 'teacher' || user.role === 'admin' || user.role === 'demo_teacher')
  const isSimulating = localStorage.getItem('questia_simulate_student') === 'true'
  const isDemoAsStudent = localStorage.getItem('questia_demo_as_student') === 'true'

  // Si el usuario acaba de registrarse como demo alumno, forzamos la simulación
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'demo_teacher' && isDemoAsStudent) {
      localStorage.setItem('questia_simulate_student', 'true');
      localStorage.removeItem('questia_demo_as_student');
      window.location.href = '/alumno';
    }
  }, [isAuthenticated, user, isDemoAsStudent]);

  return (
    <>
      <PushNotificationManager />
      <UpdateNotification />
      <FeedbackButton />
      {isTeacher && isSimulating && (
        <div className="fixed bottom-[5.5rem] right-6 z-[59] flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => {
              localStorage.removeItem('questia_simulate_student')
              window.location.href = '/docente'
            }}
            className="bg-amber-400 hover:bg-amber-300 text-black px-4 py-2 rounded-full shadow-lg shadow-amber-400/30 flex items-center gap-2 transition-all active:scale-95 group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-30"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider">Modo Alumno</span>
            <span className="text-[10px] font-black uppercase bg-black/15 px-2 py-0.5 rounded-full group-hover:bg-black/25 transition-colors">SALIR</span>
          </button>
        </div>
      )}
      <Suspense fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      }>
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
              <ErrorBoundary>
                <StudentDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/docente" element={
            <ProtectedRoute requiredRole="teacher">
              <ErrorBoundary>
                <TeacherDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/test-belbin" element={
            <ProtectedRoute>
              <BelbinTest />
            </ProtectedRoute>
          } />

          <Route path="/perfil" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/auth-error" element={<AuthErrorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" theme="dark" richColors />
      <CookieConsent />
    </>
  )
}

export default App
