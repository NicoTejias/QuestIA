import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useProfile } from '../../hooks/useProfile'
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

export default function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn } = useUser()
    const { user, isLoading } = useProfile()
    const [waitCount, setWaitCount] = useState(0)

    useEffect(() => {
        if (!isLoaded) {
            const timer = setTimeout(() => setWaitCount((c) => c + 1), 1500)
            return () => clearTimeout(timer)
        }
    }, [isLoaded])

    if (!isLoaded || isLoading && waitCount < 2) return <LoadingScreen />

    if (isSignedIn && user) {
        const userRole = user.role || 'student'
        const target = userRole === 'teacher' || userRole === 'admin' ? '/docente' : '/alumno'
        return <Navigate to={target} replace />
    }

    if (!isSignedIn && waitCount >= 2) return <>{children}</>

    return <>{children}</>
}