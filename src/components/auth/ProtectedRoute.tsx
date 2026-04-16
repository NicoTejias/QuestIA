import { useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'

function LoadingScreen() {
    return (
        <div className="min-h-screen bg-surface flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <p className="text-slate-400 font-medium">Cargando QuestIA...</p>
            </div>
        </div>
    )
}

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRole?: string
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { isLoaded, isSignedIn } = useUser()
    const { user, isLoading, refetch } = useProfile()
    const location = useLocation()
    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    // Poll for profile while it doesn't exist but Clerk is signed in
    useEffect(() => {
        if (user !== null || !isSignedIn) {
            if (pollingRef.current) clearInterval(pollingRef.current)
            return
        }
        
        // Poll every 3 seconds until profile is created by UserSync
        pollingRef.current = setInterval(() => {
            refetch()
        }, 3000)

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current)
        }
    }, [user, isSignedIn, refetch])

    // Still loading Clerk or waiting for profile
    if (!isLoaded || isLoading || (isSignedIn && user === null)) return <LoadingScreen />

    // Not signed in → login
    if (!isSignedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Profile === null means UserSync failed to create it OR user doesn't exist
    if (user === null) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    const userRole = user.role || 'student'
    const isSimulating = localStorage.getItem('questia_simulate_student') === 'true'

    const canAccessAsStudent =
        requiredRole === 'student' &&
        (userRole === 'student' || userRole === 'demo_student' ||
            (isSimulating && (userRole === 'teacher' || userRole === 'demo_teacher' || userRole === 'admin')))

    const isTeacherRole = userRole === 'teacher' || userRole === 'demo_teacher' || userRole === 'admin'

    if (
        requiredRole &&
        !canAccessAsStudent &&
        userRole !== requiredRole &&
        !(requiredRole === 'teacher' && isTeacherRole)
    ) {
        return <Navigate to={isTeacherRole ? '/docente' : '/alumno'} replace />
    }

    return <>{children}</>
}
