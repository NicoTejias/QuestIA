import type { ReactNode } from 'react'
import { capitalize } from '../../utils/dashboardUtils'

/**
 * Primitivas visuales compartidas por el Inicio de docente y alumno.
 * Paleta índigo (--iris) definida en index.css.
 */

/* ── Encabezado con barra índigo ────────────────────────────── */
export function PageHeading({ children }: { children: ReactNode }) {
    return (
        <div className="flex items-start gap-3 mb-6">
            <div className="w-[3px] self-stretch bg-iris rounded-sm" />
            <h1 className="text-2xl font-bold m-0 text-text-main">{children}</h1>
        </div>
    )
}

/* ── Tarjeta de estadística con anillo ──────────────────────── */
export interface StatItem {
    value: string | number
    label: string
    /** 0–100. Determina cuánto se rellena el anillo. */
    pct: number
    color: string
}

export function StatCards({ stats }: { stats: StatItem[] }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {stats.map((s) => (
                <div key={s.label} className="qi-stat-card">
                    <div
                        className="qi-ring"
                        style={{ background: `conic-gradient(${s.color} ${s.pct}%, rgba(255,255,255,0.08) 0)` }}
                    >
                        <div className="qi-ring-inner">
                            <div className="w-[7px] h-[7px] rounded-full" style={{ background: s.color }} />
                        </div>
                    </div>
                    <div className="min-w-0">
                        <div className="text-[19px] font-extrabold text-text-main leading-tight truncate">{s.value}</div>
                        <div className="text-xs text-quiet mt-0.5">{s.label}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}

/* ── Gráfico de barras semanal ──────────────────────────────── */
export interface WeeklyPoint {
    day: string
    value: number
    tooltip: string
}

export function WeeklyActivity({ title, data }: { title: string; data: WeeklyPoint[] }) {
    const max = Math.max(...data.map((d) => d.value), 1)
    const hasData = data.some((d) => d.value > 0)

    return (
        <div className="qi-card p-5 mb-5">
            <h2 className="qi-card-title">{title}</h2>
            {hasData ? (
                <div className="flex items-end gap-2.5 h-[110px]">
                    {data.map((d) => (
                        <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                            <span className="text-[10.5px] font-bold text-iris-light">{d.value}</span>
                            <div
                                className="qi-bar"
                                style={{ height: `${Math.max(6, Math.round((d.value / max) * 100))}%` }}
                                title={d.tooltip}
                            />
                            <span className="text-[11px] text-quieter mt-0.5">{d.day}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-[110px] flex items-center justify-center text-xs text-quieter">
                    Aún no hay actividad registrada esta semana
                </div>
            )}
        </div>
    )
}

/* ── Tarjeta de ramo con barra de progreso ──────────────────── */
export interface CourseCardItem {
    id: string
    name: string
    code?: string
    /** Métrica principal mostrada a la izquierda del pie. */
    meta: string
    /** 0–100, o null si no hay una fuente real de progreso. */
    pct: number | null
}

export function CourseGrid({
    title,
    courses,
    onSelect,
    emptyMessage,
}: {
    title: string
    courses: CourseCardItem[]
    onSelect: (id: string) => void
    emptyMessage: string
}) {
    return (
        <section className="mb-6">
            <h2 className="text-base font-bold mb-3 text-text-main">{title}</h2>
            {courses.length === 0 ? (
                <div className="qi-card p-10 text-center text-sm text-quiet">{emptyMessage}</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {courses.map((c) => (
                        <button key={c.id} className="qi-course-card" onClick={() => onSelect(c.id)}>
                            <div
                                className="h-20 flex items-end p-3"
                                style={{ background: 'linear-gradient(135deg, rgba(84,87,229,0.35), rgba(84,87,229,0.06))' }}
                            >
                                {c.code && (
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/60">{c.code}</span>
                                )}
                            </div>
                            <div className="px-3.5 pt-3 pb-4">
                                <div className="text-[13.5px] font-bold text-text-main mb-2 line-clamp-2 min-h-[2.6em]">
                                    {c.name}
                                </div>
                                {c.pct !== null && (
                                    <div className="qi-progress-track">
                                        <div className="qi-progress-fill" style={{ width: `${c.pct}%` }} />
                                    </div>
                                )}
                                <div className="flex justify-between items-center mt-2 text-[11.5px] text-quieter">
                                    <span>{c.meta}</span>
                                    {c.pct !== null && <span className="text-iris-soft font-bold">{c.pct}%</span>}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </section>
    )
}

/* ── Accesos rápidos ────────────────────────────────────────── */
export interface QuickTileItem {
    icon: ReactNode
    text: string
    sub: string
    onClick: () => void
}

export function QuickTiles({ tiles }: { tiles: QuickTileItem[] }) {
    return (
        <section>
            <h2 className="text-base font-bold mb-3 text-text-main">Accesos rápidos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {tiles.map((t) => (
                    <button key={t.text} className="qi-tile" onClick={t.onClick}>
                        <div className="qi-tile-icon text-iris-light">{t.icon}</div>
                        <div className="min-w-0">
                            <div className="text-[13.5px] font-semibold text-text-main">{t.text}</div>
                            <div className="text-[11.5px] text-quieter mt-0.5">{t.sub}</div>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    )
}

/* ── Calendario del mes ─────────────────────────────────────── */
const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

function buildCalendar(today: Date) {
    const year = today.getFullYear()
    const month = today.getMonth()
    // getDay() devuelve 0 para domingo; se desplaza para que la semana parta el lunes.
    const startDow = (new Date(year, month, 1).getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()

    const cells: { key: string; label: number; cls: string }[] = []
    for (let i = 0; i < startDow; i++) {
        cells.push({ key: `p${i}`, label: daysInPrev - startDow + i + 1, cls: 'muted' })
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ key: `d${d}`, label: d, cls: d === today.getDate() ? 'today' : '' })
    }
    let next = 1
    while (cells.length % 7 !== 0) {
        cells.push({ key: `n${next}`, label: next++, cls: 'muted' })
    }
    return cells
}

export interface OnboardingStep {
    title: string
    body: string
    onClick?: () => void
}

export function SideRail({ steps }: { steps: OnboardingStep[] }) {
    const today = new Date()
    const monthLabel = capitalize(today.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }))
    const days = buildCalendar(today)

    return (
        <aside className="w-[280px] shrink-0 border-l border-white/5 px-5 py-6 hidden xl:block overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[14.5px] font-bold text-text-main">{monthLabel}</span>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
                {WEEKDAYS.map((w) => (
                    <div key={w} className="text-center text-[11px] text-quieter pb-1.5">{w}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-6">
                {days.map((d) => (
                    <div key={d.key} className={`qi-cal-day ${d.cls}`}>{d.label}</div>
                ))}
            </div>

            {steps.length > 0 && (
                <>
                    <div className="text-[11px] uppercase tracking-[0.06em] text-quieter mb-2.5">Primeros pasos</div>
                    {steps.map((s, i) => (
                        <div key={s.title} className="flex gap-2.5 mb-3.5">
                            <div className="qi-step-num">{i + 1}</div>
                            <div className="min-w-0">
                                <button
                                    onClick={s.onClick}
                                    disabled={!s.onClick}
                                    className="text-[13.5px] text-iris-light hover:text-iris-soft text-left disabled:cursor-default disabled:hover:text-iris-light"
                                >
                                    {s.title}
                                </button>
                                <div className="text-xs text-quieter mt-0.5">{s.body}</div>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </aside>
    )
}
