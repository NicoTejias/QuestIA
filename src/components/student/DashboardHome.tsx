import { Target, Trophy, Gift, User } from 'lucide-react'
import EvaluacionesPanel from './EvaluacionesPanel'
import {
    PageHeading,
    StatCards,
    CourseGrid,
    QuickTiles,
    SideRail,
    type StatItem,
    type CourseCardItem,
    type OnboardingStep,
} from '../dashboard/primitives'
import { capitalize } from '../../utils/dashboardUtils'

interface DashboardHomeProps {
    courses: any[]
    totalRanking: number
    firstName: string
    onSelectCourse: (id: string) => void
    onTabChange: (tab: string) => void
    user: any
}

export default function DashboardHome({
    courses,
    totalRanking,
    onSelectCourse,
    onTabChange,
    user,
}: DashboardHomeProps) {
    const today = new Date()
    const dateLabel = capitalize(
        today.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    )

    const streak = user.daily_streak || 0
    const spendable = courses.reduce(
        (sum: number, c: any) => sum + (c.spendable_points || c.total_points || 0),
        0
    )

    const statItems: StatItem[] = [
        {
            value: `${streak} ${streak === 1 ? 'día' : 'días'}`,
            label: 'Racha actual',
            // Se considera una racha de 7 días como ciclo completo del anillo.
            pct: Math.min(100, (streak / 7) * 100),
            color: '#f5a524',
        },
        { value: courses.length, label: 'Ramos inscritos', pct: courses.length > 0 ? 100 : 0, color: '#5457e5' },
        {
            value: totalRanking.toLocaleString(),
            label: 'Puntos de ranking',
            pct: totalRanking > 0 ? 100 : 0,
            color: '#22c55e',
        },
        {
            value: spendable.toLocaleString(),
            label: 'Puntos canjeables',
            pct: totalRanking > 0 ? Math.min(100, (spendable / totalRanking) * 100) : 0,
            color: '#8890f5',
        },
    ]

    // Proporción de los puntos totales del alumno que aporta cada ramo.
    const courseCards: CourseCardItem[] = courses.map((c: any) => {
        const pts = c.ranking_points || c.total_points || 0
        return {
            id: c.id,
            name: c.name,
            code: c.code,
            meta: `${pts.toLocaleString()} pts`,
            pct: totalRanking > 0 ? Math.round((pts / totalRanking) * 100) : null,
        }
    })

    const steps: OnboardingStep[] = []
    if (!user.belbin_profile?.role_dominant) {
        steps.push({
            title: 'Completa tu perfil Belbin',
            body: '56 preguntas para tu rol de equipo',
            onClick: () => onTabChange('perfil'),
        })
    }
    if (courses.length === 0) {
        steps.push({ title: 'Únete a un ramo', body: 'Tu docente debe inscribir tu RUT en la lista' })
    } else if (totalRanking === 0) {
        steps.push({
            title: 'Resuelve tu primer quiz',
            body: 'Gana puntos de ranking y canjeables',
            onClick: () => onTabChange('misiones'),
        })
    }

    return (
        <div className="flex">
            <div className="flex-1 min-w-0 max-w-[860px]">
                <PageHeading>{dateLabel}</PageHeading>

                <StatCards stats={statItems} />

                <section className="mb-6">
                    <h2 className="text-base font-bold mb-3 text-text-main">Mis evaluaciones</h2>
                    <EvaluacionesPanel />
                </section>

                <CourseGrid
                    title="Mis ramos"
                    courses={courseCards}
                    onSelect={onSelectCourse}
                    emptyMessage="Sin ramos inscritos. Comunícate con tu docente si tu RUT debería estar en la lista de alumnos."
                />

                <QuickTiles
                    tiles={[
                        {
                            icon: <Target className="w-4 h-4" />,
                            text: 'Ver misiones',
                            sub: 'Desafíos disponibles',
                            onClick: () => onTabChange('misiones'),
                        },
                        {
                            icon: <Trophy className="w-4 h-4" />,
                            text: 'Mi posición',
                            sub: 'Ranking general',
                            onClick: () => onTabChange('ranking'),
                        },
                        {
                            icon: <Gift className="w-4 h-4" />,
                            text: 'Canjear puntos',
                            sub: `${spendable.toLocaleString()} disponibles`,
                            onClick: () => onTabChange('tienda'),
                        },
                        {
                            icon: <User className="w-4 h-4" />,
                            text: 'Perfil Belbin',
                            sub: user.belbin_profile?.role_dominant || 'Completa tu rol de equipo',
                            onClick: () => onTabChange('perfil'),
                        },
                    ]}
                />
            </div>

            <SideRail steps={steps} />
        </div>
    )
}
