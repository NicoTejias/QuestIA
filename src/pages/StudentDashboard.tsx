import { useState, useEffect } from 'react'
import { useQuery, useMutation } from "convex/react"
import { useClerk } from "@clerk/clerk-react"
import { useNavigate } from 'react-router-dom'
import { api } from "../../convex/_generated/api"
import { Loader2 } from 'lucide-react'

// Importaciones de sub-componentes modulares
import DashboardSidebar from '../components/student/DashboardSidebar'
import DashboardHeader from '../components/student/DashboardHeader'
import DashboardHome from '../components/student/DashboardHome'
import CourseDetailView from '../components/student/CourseDetailView'
import MisionesPanel from '../components/student/MisionesPanel'
import RankingPanel from '../components/student/RankingPanel'
import NotificacionesPanel from '../components/student/NotificacionesPanel'
import TiendaPanel from '../components/student/TiendaPanel'
import PerfilPanel from '../components/student/PerfilPanel'
import QuizPlayer from '../components/student/QuizPlayer'
import TransferModal from '../components/student/TransferModal'
import CompleteProfileModal from '../components/student/CompleteProfileModal'

// Utilidades
import { getFirstName } from '../utils/dashboardUtils'

export default function StudentDashboard() {
    const { signOut } = useClerk()
    const navigate = useNavigate()
    const user = useQuery(api.users.getProfile)
    const courses = useQuery(api.courses.getMyCourses)

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('inicio')
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [showQuizPlayer, setShowQuizPlayer] = useState<any>(null)
    const [showCompleteProfile, setShowCompleteProfile] = useState(false)

    // Lógica de auto-enrolamiento y perfil
    const autoEnroll = useMutation(api.users.autoEnroll)
    useEffect(() => {
        if (user && user.role === 'student') {
            if (!user.student_id) {
                setShowCompleteProfile(true)
            } else {
                autoEnroll().catch(() => { })
            }
        }
    }, [user, autoEnroll])

    const handleLogout = async () => {
        await signOut()
        navigate('/')
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        )
    }

    const userName = user?.name || 'Alumno'
    const firstName = getFirstName(user?.name)
    const belbinRole = user?.belbin_profile?.role_dominant || 'Sin determinar'

    // Totales agregados de todos los ramos
    const totalRankingPoints = courses?.reduce((sum: number, c: any) => sum + (c.ranking_points || c.total_points || 0), 0) || 0
    const totalSpendablePoints = courses?.reduce((sum: number, c: any) => sum + (c.spendable_points || c.total_points || 0), 0) || 0

    const tabs = [
        { id: 'inicio', label: 'Inicio', icon: '📊' },
        { id: 'notificaciones', label: 'Notificaciones', icon: '🔔' },
        { id: 'misiones', label: 'Misiones', icon: '🎯' },
        { id: 'ranking', label: 'Ranking', icon: '🏆' },
        { id: 'tienda', label: 'Tienda', icon: '🎁' },
        { id: 'perfil', label: 'Mi Perfil', icon: '👤' },
    ]

    return (
        <div className="min-h-screen bg-surface flex text-slate-200 pb-safe">

            {showCompleteProfile && (
                <CompleteProfileModal 
                    user={user} 
                    onComplete={() => setShowCompleteProfile(false)} 
                />
            )}

            <DashboardSidebar 
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                user={user}
                userName={userName}
                belbinRole={belbinRole}
                totalRankingPoints={totalRankingPoints}
                totalSpendablePoints={totalSpendablePoints}
                tabs={tabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                selectedCourseId={selectedCourseId}
                setSelectedCourseId={setSelectedCourseId}
                setShowTransferModal={setShowTransferModal}
                handleLogout={handleLogout}
            />

            {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Main Content */}
            <main className="flex-1 min-h-screen flex flex-col">
                <DashboardHeader 
                    setSidebarOpen={setSidebarOpen}
                    activeTab={activeTab}
                    tabs={tabs}
                    selectedCourseId={selectedCourseId}
                    totalSpendablePoints={totalSpendablePoints}
                />

                <div className="p-6 flex-1 overflow-y-auto">
                    {selectedCourseId ? (
                        <CourseDetailView
                            courseId={selectedCourseId as any}
                            currentUserId={user._id}
                            onBack={() => setSelectedCourseId(null)}
                            onPlayQuiz={(quiz: any) => setShowQuizPlayer(quiz)}
                        />
                    ) : (
                        <>
                            {activeTab === 'inicio' && <DashboardHome
                                courses={courses || []}
                                totalRanking={totalRankingPoints}
                                firstName={firstName}
                                onSelectCourse={(id) => setSelectedCourseId(id)}
                            />}
                            {activeTab === 'notificaciones' && <NotificacionesPanel />}
                            {activeTab === 'misiones' && <MisionesPanel courses={courses || []} onSelectCourse={(id: string) => { setSelectedCourseId(id); setActiveTab('ramos') }} />}
                            {activeTab === 'ranking' && <RankingPanel courses={courses || []} />}
                            {activeTab === 'tienda' && <TiendaPanel courses={courses || []} />}
                            {activeTab === 'perfil' && <PerfilPanel user={user} totalPoints={totalRankingPoints} belbinRole={belbinRole} />}
                        </>
                    )}
                </div>
            </main>

            {/* Modals */}
            {showTransferModal && <TransferModal onClose={() => setShowTransferModal(false)} courses={courses || []} />}
            {showQuizPlayer && <QuizPlayer quiz={showQuizPlayer} onClose={() => setShowQuizPlayer(null)} />}
        </div>
    )
}
