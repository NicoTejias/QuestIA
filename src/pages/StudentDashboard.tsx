import { useState, useEffect } from 'react'
import { useClerk, useUser } from "@clerk/clerk-react"
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { ProfilesAPI, CoursesAPI } from '../lib/api'

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
import BartlePopup from '../components/student/BartlePopup'
import { BartleProfileDisplay } from '../components/student/BartleTest'
import RetentionProgressWidget from '../components/student/RetentionProgressWidget'
import FAQSection from '../components/FAQSection'
import ErrorBoundary from '../components/ErrorBoundary'

// Utilidades
import { getFirstName } from '../utils/dashboardUtils'

export default function StudentDashboard() {
    const { signOut } = useClerk()
    const { user: clerkUser } = useUser()
    const navigate = useNavigate()
    
    const { data: profile } = useSupabaseQuery(() => ProfilesAPI.getProfile(clerkUser?.id || ''), [clerkUser])
    const { data: courses } = useSupabaseQuery(() => CoursesAPI.getMyCourses(profile?.id || '', profile?.role || 'student'), [profile])

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('inicio')
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [showQuizPlayer, setShowQuizPlayer] = useState<any>(null)
    const [showCompleteProfile, setShowCompleteProfile] = useState(false)

    // Lógica de auto-enrolamiento y perfil
    useEffect(() => {
        if (!profile) return;
        const isRealStudent = profile.role === 'student' && !profile.is_demo;
        
        if (isRealStudent) {
            if (!profile.student_id) {
                setShowCompleteProfile(true)
            } else {
                ProfilesAPI.autoEnroll(clerkUser?.id || '', profile.student_id, profile.email).catch(() => { })
            }
        }
    }, [profile, clerkUser])

    const handleLogout = async () => {
        await signOut()
        navigate('/')
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        )
    }

    const userName = profile?.name || 'Alumno'
    const firstName = getFirstName(profile?.name)
    const belbinRole = profile?.belbin_profile?.role_dominant || 'Sin determinar'

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
        { id: 'ayuda', label: 'Ayuda', icon: '❓' },
    ]

    return (
        <div className="h-screen-dvh bg-surface flex text-text-main overflow-hidden relative">

            {showCompleteProfile && (
                <CompleteProfileModal 
                    user={profile} 
                    onComplete={() => setShowCompleteProfile(false)} 
                />
            )}

            <DashboardSidebar 
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                user={profile}
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
            <main className="flex-1 h-screen-dvh flex flex-col overflow-hidden pb-safe">
                <DashboardHeader 
                    setSidebarOpen={setSidebarOpen}
                    activeTab={activeTab}
                    tabs={tabs}
                    selectedCourseId={selectedCourseId}
                    totalSpendablePoints={totalSpendablePoints}
                />

                <div className="p-4 md:p-6 flex-1 overflow-y-auto">
                    {selectedCourseId ? (
                        <CourseDetailView
                            courseId={selectedCourseId as any}
                            onBack={() => setSelectedCourseId(null)}
                            onPlayQuiz={(quiz: any) => setShowQuizPlayer(quiz)}
                        />
                    ) : (
                        <>
                            {activeTab === 'inicio' && (
                                <div className="space-y-6 overflow-x-hidden">
                                    {!profile.bartle_profile && !!profile.terms_accepted_at && (
                                        <BartlePopup user={profile} onComplete={() => {}} />
                                    )}
                                    {profile.bartle_profile && (
                                        <BartleProfileDisplay profile={profile.bartle_profile} />
                                    )}
                                    <RetentionProgressWidget 
                                        user={profile} 
                                        courses={courses || []} 
                                    />
                                    <DashboardHome
                                        courses={courses || []}
                                        totalRanking={totalRankingPoints}
                                        firstName={firstName}
                                        onSelectCourse={(id) => setSelectedCourseId(id)}
                                        onTabChange={setActiveTab}
                                        user={profile}
                                    />

                                </div>
                            )}
                            {activeTab === 'notificaciones' && <NotificacionesPanel />}
                            {activeTab === 'misiones' && <MisionesPanel courses={courses || []} onSelectCourse={(id: string) => { setSelectedCourseId(id); setActiveTab('ramos') }} />}
                            {activeTab === 'ranking' && <RankingPanel courses={courses || []} />}
                            {activeTab === 'tienda' && <TiendaPanel courses={courses || []} />}
                            {activeTab === 'perfil' && <PerfilPanel user={profile} totalPoints={totalRankingPoints} belbinRole={belbinRole} />}
                            {activeTab === 'ayuda' && <FAQSection category="alumno" />}
                        </>
                    )}
                </div>
            </main>

            {/* Modals */}
            {showTransferModal && <TransferModal onClose={() => setShowTransferModal(false)} courses={courses || []} />}
            {showQuizPlayer && (
                <ErrorBoundary onReset={() => setShowQuizPlayer(null)}>
                    <QuizPlayer quiz={showQuizPlayer} onClose={() => setShowQuizPlayer(null)} />
                </ErrorBoundary>
            )}
        </div>
    )
}

