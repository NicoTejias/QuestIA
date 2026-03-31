import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useConvexAuth, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Loader2 } from 'lucide-react'

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
    const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth()
    const user = useQuery(api.users.getProfile, isAuthenticated ? undefined : 'skip')
    const location = useLocation()
    const [stuckCount, setStuckCount] = useState(0)

    useEffect(() => {
        if (isAuthLoading || !isAuthenticated || user !== undefined) return
        if (stuckCount > 5) return
        const timer = setTimeout(() => setStuckCount((c) => c + 1), 1000)
        return () => clearTimeout(timer)
    }, [user, stuckCount, isAuthLoading, isAuthenticated])

    if (isAuthLoading) return <LoadingScreen />

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (user === undefined) {
        if (stuckCount > 5) return <Navigate to="/login" replace />
        return <LoadingScreen />
    }

    if (user === null) return <Navigate to="/login" replace />

    const userRole = (user as any)?.role || 'student'
    const isSimulating = localStorage.getItem('questia_simulate_student') === 'true'

    const canAccessAsStudent =
        requiredRole === 'student' &&
        (userRole === 'student' || (isSimulating && (userRole === 'teacher' || userRole === 'admin')))

    if (
        requiredRole &&
        !canAccessAsStudent &&
        userRole !== requiredRole &&
        !(requiredRole === 'teacher' && userRole === 'admin')
    ) {
        const target = userRole === 'teacher' || userRole === 'admin' ? '/docente' : '/alumno'
        return <Navigate to={target} replace />
    }

    return <>{children}</>
}
