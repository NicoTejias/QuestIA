import { Sparkles, FileText, Trophy, ArrowRightLeft, Target, User } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { AnalyticsAPI } from '../../lib/api'
import { getTodayEphemeris } from '../../data/efemerides'
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

interface Props {
    user: any
    courses: any[]
    onTabChange: (tab: string) => void
}

export default function InicioDocente({ user, courses, onTabChange }: Props) {
    const { data: stats } = useSupabaseQuery(
        () => AnalyticsAPI.getTeacherStats(user.clerk_id, user.role),
        [user]
    )

    const coursesCount = courses.length
    const today = new Date()
    const dateLabel = capitalize(
        today.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    )

    const registered = stats?.totalRegisteredUniqueUsers ?? 0
    const whitelisted = stats?.totalUniqueStudents ?? 0
    const adoptionPct = whitelisted > 0 ? Math.round((registered / whitelisted) * 100) : 0
    const avgScore = Math.round(stats?.avgQuizScore ?? 0)

    const statItems: StatItem[] = [
        { value: coursesCount, label: 'Ramos activos', pct: coursesCount > 0 ? 100 : 0, color: '#5457e5' },
        { value: stats ? `${adoptionPct}%` : '—', label: 'Adopción estudiantil', pct: adoptionPct, color: '#22c55e' },
        {
            value: stats ? stats.totalQuizzesCompleted : '—',
            label: 'Quizzes completados',
            // El anillo no tiene un máximo natural: se llena si hay actividad.
            pct: (stats?.totalQuizzesCompleted ?? 0) > 0 ? 100 : 0,
            color: '#f5a524',
        },
        { value: stats ? `${avgScore}%` : '—', label: 'Puntaje promedio', pct: avgScore, color: '#8890f5' },
    ]

    // Progreso por ramo = proporción de alumnos de la whitelist que ya se registraron.
    const courseCards: CourseCardItem[] = courses.map((c: any) => {
        const cs = stats?.courseStats?.find((s: any) => s.id === c.id)
        const pct = cs && cs.students > 0 ? Math.round((cs.registered / cs.students) * 100) : null
        return {
            id: c.id,
            name: c.name,
            code: c.code,
            meta: cs ? `${cs.registered}/${cs.students} inscritos` : 'Sin whitelist',
            pct,
        }
    })

    const steps: OnboardingStep[] = []
    if (coursesCount === 0) {
        steps.push({ title: 'Crea tu primer ramo', body: 'Organiza secciones y alumnos', onClick: () => onTabChange('ramos') })
    }
    if ((stats?.totalDocuments ?? 0) === 0) {
        steps.push({ title: 'Sube material de apoyo', body: 'PDF, DOCX con extracción de texto', onClick: () => onTabChange('material') })
    }
    if ((stats?.totalMissionsCreated ?? 0) === 0) {
        steps.push({ title: 'Genera un desafío con IA', body: 'Quizzes automáticos desde tu material', onClick: () => onTabChange('desafios') })
    }

    return (
        <div className="flex">
            <div className="flex-1 min-w-0 max-w-[860px]">
                <PageHeading>{dateLabel}</PageHeading>

                <StatCards stats={statItems} />

                {/* Efeméride del día */}
                <div className="qi-card p-4 mb-5 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-[10px] bg-amber-500/10 flex items-center justify-center shrink-0">
                        <span className="text-lg">📅</span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-amber-300 font-bold text-[13px] mb-1">Efeméride educativa</h3>
                        <p className="text-quiet text-[13px] leading-relaxed">{getTodayEphemeris()}</p>
                    </div>
                </div>

                {/* Metas semestrales */}
                {stats && (
                    <div className="qi-card p-5 mb-5">
                        <h2 className="qi-card-title flex items-center gap-2">
                            <Target className="w-4 h-4 text-iris-light" />
                            Metas semestrales
                        </h2>
                        <div className="flex flex-col gap-4">
                            <KPIBar label="Adopción estudiantil" value={adoptionPct} max={100} unit="%" goal="90%" />
                            <KPIBar
                                label="Quizzes / alumno"
                                value={+(stats.totalQuizzesCompleted / (registered || 1)).toFixed(1)}
                                max={15}
                                unit=" qzs"
                                goal="15 quizzes"
                            />
                            <KPIBar label="Recompensas canjeadas" value={stats.totalRedemptions} max={50} unit=" canjes" goal="50 canjes" />
                        </div>
                    </div>
                )}

                <CourseGrid
                    title="Resumen por ramo"
                    courses={courseCards}
                    onSelect={() => onTabChange('ramos')}
                    emptyMessage="Aún no tienes ramos. Crea el primero desde Mis Ramos."
                />

                {/* Detalle: registro por ramo */}
                {stats && stats.courseStats?.length > 0 && (
                    <div className="qi-card p-5 mb-5">
                        <h2 className="qi-card-title flex items-center gap-2">
                            <User className="w-4 h-4 text-iris-light" />
                            Registro por ramo
                        </h2>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height={280} minWidth={0}>
                                <BarChart data={stats.courseStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#6b6d78"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v: any) => String(v).slice(0, 15) + (String(v).length > 15 ? '…' : '')}
                                    />
                                    <YAxis stroke="#6b6d78" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#101118', borderColor: '#2a2c38', borderRadius: '10px', fontSize: '12px' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                        cursor={{ fill: '#ffffff08' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                    <Bar dataKey="students" name="En whitelist" fill="#4a4c56" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="registered" name="Registrados" fill="#5457e5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <QuickTiles
                    tiles={[
                        {
                            icon: <Sparkles className="w-4 h-4" />,
                            text: 'Crear desafío con IA',
                            sub: 'Genera un quiz en segundos',
                            onClick: () => onTabChange('desafios'),
                        },
                        {
                            icon: <FileText className="w-4 h-4" />,
                            text: 'Subir material',
                            sub: 'PDF, DOCX y más',
                            onClick: () => onTabChange('material'),
                        },
                        {
                            icon: <Trophy className="w-4 h-4" />,
                            text: 'Ver ranking',
                            sub: 'Compara tus ramos',
                            onClick: () => onTabChange('ranking'),
                        },
                        {
                            icon: <ArrowRightLeft className="w-4 h-4" />,
                            text: 'Solicitudes de canje',
                            sub: 'Aprueba recompensas',
                            onClick: () => onTabChange('canjes'),
                        },
                    ]}
                />
            </div>

            <SideRail steps={steps} />
        </div>
    )
}

function KPIBar({ label, value, max, unit, goal }: { label: string; value: number; max: number; unit: string; goal: string }) {
    const pct = Math.min(100, (value / max) * 100)
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-quiet">{label}</span>
                <span className="text-[15px] font-extrabold text-text-main">{value}{unit}</span>
            </div>
            <div className="qi-progress-track">
                <div className="qi-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-quieter text-right">Meta: {goal}</span>
        </div>
    )
}
