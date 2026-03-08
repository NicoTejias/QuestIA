import { useState, useRef } from 'react'
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Users, Plus, Trash2, Loader2, Sparkles } from 'lucide-react'
import Papa from 'papaparse'
import { extractTextFromFile, getFileType, getFileIcon, formatFileSize } from '../utils/documentParser'
import { formatRutWithDV, cleanRut, calculateRutDV } from '../utils/rutUtils'
import { toast } from 'sonner'

export default function GruposPanel() {
    const courses = useQuery(api.courses.getMyCourses)
    const generateGroups = useMutation(api.groups.generateGroups)
    const [selectedCourse, setSelectedCourse] = useState('')
    const [groupSize, setGroupSize] = useState(3)
    const [generating, setGenerating] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState('')

    // Obtener grupos existentes del ramo seleccionado
    const existingGroups = useQuery(
        api.groups.getGroups,
        selectedCourse ? { course_id: selectedCourse as any } : "skip"
    )

    const handleGenerate = async () => {
        if (!selectedCourse) {
            setError('Selecciona un ramo primero.')
            return
        }
        setGenerating(true)
        setError('')
        setResult(null)
        try {
            const res = await generateGroups({
                course_id: selectedCourse as any,
                group_size: groupSize,
            })
            setResult(res)
        } catch (err: any) {
            setError(err.message || 'Error al generar grupos')
        } finally {
            setGenerating(false)
        }
    }

    const rolEmoji: Record<string, string> = {
        'Cerebro': '🧠', 'Monitor': '🔍', 'Coordinador': '👑',
        'Investigador': '🌐', 'Cohesionador': '🤝', 'Impulsor': '⚡',
        'Implementador': '⚙️', 'Finalizador': '🎯', 'Sin determinar': '❓',
    }

    const categoryColor: Record<string, string> = {
        'Mental': 'text-blue-400', 'Social': 'text-green-400',
        'Acción': 'text-orange-400', 'Sin categoría': 'text-slate-500',
    }

    // Determinar qué grupos mostrar: resultado fresco o existentes
    const displayGroups = result ? result.groups : (existingGroups || []).filter((g: any) => g.name !== 'Sin grupo')

    return (
        <div>
            <p className="text-slate-400 mb-6">Genera grupos equilibrados automáticamente basándose en los perfiles Belbin de tus alumnos.</p>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <span className="text-red-400 shrink-0">⚠️</span>
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            <div className="bg-surface-light border border-white/5 rounded-2xl p-6 mb-6 space-y-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo</label>
                        <select
                            value={selectedCourse}
                            onChange={e => { setSelectedCourse(e.target.value); setResult(null) }}
                            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                            aria-label="Selecciona un ramo para generar grupos"
                        >
                            <option value="">Selecciona un ramo</option>
                            {(courses || []).map((c: any) => (
                                <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-48">
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Alumnos por grupo</label>
                        <input
                            type="number"
                            value={groupSize}
                            onChange={e => setGroupSize(Number(e.target.value))}
                            min={2} max={8}
                            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                            aria-label="Cantidad de alumnos por grupo"
                        />
                    </div>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating || !selectedCourse}
                    className="bg-gradient-to-r from-primary to-accent text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
                    {generating ? 'Generando...' : 'Generar Grupos Inteligentes'}
                </button>
            </div>

            {result && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 text-sm font-medium">
                        ✅ {result.total_groups} grupos generados con {result.total_students} alumnos
                    </p>
                </div>
            )}

            {displayGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayGroups.map((group: any, idx: number) => (
                        <div key={idx} className="bg-surface-light border border-white/5 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <Users className="w-5 h-5 text-accent-light" />
                                    {group.name}
                                </h3>
                                <span className="text-xs text-slate-500">{group.members.length} miembros</span>
                            </div>
                            {/* Balance bar */}
                            <div className="flex gap-1 mb-4 h-2 rounded-full overflow-hidden bg-surface">
                                {group.stats?.mental > 0 && <div className="bg-blue-400" style={{ flex: group.stats.mental }} />}
                                {group.stats?.social > 0 && <div className="bg-green-400" style={{ flex: group.stats.social }} />}
                                {(group.stats?.accion > 0 || group.stats?.acción > 0) && <div className="bg-orange-400" style={{ flex: group.stats.accion || group.stats.acción }} />}
                            </div>
                            <div className="flex gap-3 mb-4 text-xs">
                                <span className="text-blue-400">🧠 {group.stats?.mental || 0}</span>
                                <span className="text-green-400">🤝 {group.stats?.social || 0}</span>
                                <span className="text-orange-400">⚡ {group.stats?.accion || group.stats?.acción || 0}</span>
                            </div>
                            <div className="space-y-2">
                                {group.members.map((m: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between bg-surface rounded-xl px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{rolEmoji[m.belbinRole] || '❓'}</span>
                                            <span className="text-white font-medium text-sm">{m.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-primary-light text-xs font-semibold block">{m.belbinRole}</span>
                                            <span className={`text-xs ${categoryColor[m.belbinCategory] || 'text-slate-500'}`}>{m.belbinCategory}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : selectedCourse ? (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Sin grupos aún</h4>
                    <p className="text-slate-400 text-sm">Selecciona un ramo con alumnos inscritos y haz clic en "Generar Grupos Inteligentes".</p>
                </div>
            ) : null}
        </div>
    )
}
