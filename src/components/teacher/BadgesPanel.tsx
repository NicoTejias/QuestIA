import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Award, Plus, Trash2, UserPlus, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import ConfirmModal from '../ConfirmModal'

const CRITERIA_LABELS: Record<string, string> = {
    attendance: 'Asistencia',
    improvement: 'Mejora',
    social: 'Social',
    mastery: 'Maestría',
    custom: 'Personalizado',
}

const CRITERIA_COLORS: Record<string, string> = {
    attendance: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    improvement: 'text-green-400 bg-green-400/10 border-green-400/20',
    social: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    mastery: 'text-gold bg-gold/10 border-gold/20',
    custom: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
}

interface BadgesPanelProps {
    courseId: any
    students: any[]
}

export default function BadgesPanel({ courseId, students }: BadgesPanelProps) {
    const badges = useQuery(api.badges.getBadgesByCourse, { course_id: courseId })
    const createBadge = useMutation(api.badges.createBadge)
    const deleteBadge = useMutation(api.badges.deleteBadge)
    const awardBadge = useMutation(api.badges.awardBadge)
    const revokeBadge = useMutation(api.badges.revokeBadge)

    const [showForm, setShowForm] = useState(false)
    const [expandedBadge, setExpandedBadge] = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<{ badgeId: any; name: string } | null>(null)
    const [processingDelete, setProcessingDelete] = useState(false)
    const [awardingBadge, setAwardingBadge] = useState<string | null>(null) // badge_id being awarded

    // New badge form state
    const [form, setForm] = useState({ name: '', icon: '🏅', description: '', criteria_type: 'mastery' })
    const [submitting, setSubmitting] = useState(false)

    const registeredStudents = students.filter((s) => s.status === 'registered')

    const handleCreateBadge = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) return toast.error('El nombre es obligatorio')
        setSubmitting(true)
        try {
            await createBadge({ course_id: courseId, ...form })
            toast.success(`Insignia "${form.name}" creada`)
            setForm({ name: '', icon: '🏅', description: '', criteria_type: 'mastery' })
            setShowForm(false)
        } catch (err: any) {
            toast.error(err.message || 'Error al crear la insignia')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteBadge = async () => {
        if (!confirmDelete) return
        setProcessingDelete(true)
        try {
            await deleteBadge({ badge_id: confirmDelete.badgeId })
            toast.success('Insignia eliminada')
            setExpandedBadge(null)
        } catch (err: any) {
            toast.error(err.message || 'Error al eliminar')
        } finally {
            setProcessingDelete(false)
            setConfirmDelete(null)
        }
    }

    return (
        <div className="bg-surface-light border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-gold" />
                    Insignias del Ramo
                    <span className="text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full border border-gold/20">
                        {badges?.length ?? 0}
                    </span>
                </h3>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-bold bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 px-3 py-1.5 rounded-lg transition-all"
                >
                    {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {showForm ? 'Cancelar' : 'Nueva'}
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <form onSubmit={handleCreateBadge} className="bg-black/20 border border-white/5 rounded-xl p-4 mb-4 space-y-3">
                    <div className="flex gap-3">
                        <div className="shrink-0">
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Ícono</label>
                            <input
                                type="text"
                                value={form.icon}
                                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                                maxLength={4}
                                className="w-14 text-2xl text-center bg-black/30 border border-white/10 rounded-lg p-2 focus:outline-none focus:border-gold/30"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Nombre *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Ej: Maestro del Cálculo"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/30 placeholder:text-slate-600"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Descripción</label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Ej: Domina los contenidos con excelencia"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/30 placeholder:text-slate-600"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Criterio</label>
                        <select
                            value={form.criteria_type}
                            onChange={(e) => setForm({ ...form, criteria_type: e.target.value })}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/30"
                        >
                            <option value="mastery">Maestría</option>
                            <option value="attendance">Asistencia</option>
                            <option value="improvement">Mejora</option>
                            <option value="social">Social</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 font-bold py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Crear Insignia
                    </button>
                </form>
            )}

            {/* Badge list */}
            {badges === undefined ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
            ) : badges.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                    <Award className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No hay insignias creadas</p>
                    <p className="text-slate-600 text-xs mt-1">Crea una para motivar a tus alumnos</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {badges.map((badge: any) => (
                        <BadgeRow
                            key={badge._id}
                            badge={badge}
                            expanded={expandedBadge === badge._id}
                            onToggle={() => setExpandedBadge(expandedBadge === badge._id ? null : badge._id)}
                            onDelete={() => setConfirmDelete({ badgeId: badge._id, name: badge.name })}
                            registeredStudents={registeredStudents}
                            onAward={async (studentId) => {
                                setAwardingBadge(badge._id)
                                try {
                                    await awardBadge({ badge_id: badge._id, student_id: studentId, course_id: courseId })
                                    toast.success('Insignia otorgada')
                                } catch (err: any) {
                                    toast.error(err.message || 'Error al otorgar insignia')
                                } finally {
                                    setAwardingBadge(null)
                                }
                            }}
                            onRevoke={async (userBadgeId) => {
                                try {
                                    await revokeBadge({ user_badge_id: userBadgeId })
                                    toast.success('Insignia revocada')
                                } catch (err: any) {
                                    toast.error(err.message || 'Error al revocar')
                                }
                            }}
                            awardingThis={awardingBadge === badge._id}
                            criteriaLabel={CRITERIA_LABELS[badge.criteria_type] ?? badge.criteria_type}
                            criteriaColor={CRITERIA_COLORS[badge.criteria_type] ?? CRITERIA_COLORS.custom}
                        />
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDeleteBadge}
                loading={processingDelete}
                title="Eliminar Insignia"
                message={`¿Eliminar la insignia "${confirmDelete?.name}"? Se revocará de todos los alumnos que la tienen.`}
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    )
}

function BadgeRow({
    badge,
    expanded,
    onToggle,
    onDelete,
    registeredStudents,
    onAward,
    onRevoke,
    awardingThis,
    criteriaLabel,
    criteriaColor,
}: {
    badge: any
    expanded: boolean
    onToggle: () => void
    onDelete: () => void
    registeredStudents: any[]
    onAward: (studentId: any) => Promise<void>
    onRevoke: (userBadgeId: any) => Promise<void>
    awardingThis: boolean
    criteriaLabel: string
    criteriaColor: string
}) {
    const holders = useQuery(api.badges.getBadgeHolders, expanded ? { badge_id: badge._id } : 'skip')
    const [selectedStudent, setSelectedStudent] = useState('')

    const holderIds = new Set(holders?.map((h: any) => h.user_id.toString()) ?? [])
    const availableStudents = registeredStudents.filter((s) => !holderIds.has(s._id.toString()))

    const handleAward = async () => {
        if (!selectedStudent) return
        await onAward(selectedStudent as any)
        setSelectedStudent('')
    }

    return (
        <div className="border border-white/5 rounded-xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
            >
                <span className="text-2xl shrink-0">{badge.icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{badge.name}</p>
                    {badge.description && (
                        <p className="text-slate-500 text-xs truncate">{badge.description}</p>
                    )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${criteriaColor} shrink-0`}>
                    {criteriaLabel}
                </span>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete() }}
                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all shrink-0"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </button>

            {expanded && (
                <div className="border-t border-white/5 bg-black/10 p-4 space-y-3">
                    {/* Award to student */}
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Otorgar a alumno</p>
                        {availableStudents.length === 0 ? (
                            <p className="text-slate-600 text-xs">Todos los alumnos registrados ya tienen esta insignia</p>
                        ) : (
                            <div className="flex gap-2">
                                <select
                                    value={selectedStudent}
                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold/30"
                                >
                                    <option value="">Seleccionar alumno...</option>
                                    {availableStudents.map((s) => (
                                        <option key={s._id} value={s._id}>
                                            {s.name || s.identifier || 'Sin nombre'}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAward}
                                    disabled={!selectedStudent || awardingThis}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                                >
                                    {awardingThis ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <UserPlus className="w-3.5 h-3.5" />
                                    )}
                                    Otorgar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Holders list */}
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">
                            Titulares ({holders?.length ?? '…'})
                        </p>
                        {holders === undefined ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                        ) : holders.length === 0 ? (
                            <p className="text-slate-600 text-xs">Nadie tiene esta insignia aún</p>
                        ) : (
                            <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                {holders.map((h) => (
                                    <li key={h._id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-1.5">
                                        <span className="text-xs text-white truncate">{h.userName}</span>
                                        <button
                                            onClick={() => onRevoke(h._id)}
                                            className="text-slate-600 hover:text-red-400 transition-colors ml-2 shrink-0"
                                            title="Revocar"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
