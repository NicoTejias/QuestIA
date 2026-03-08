import { useState, useRef } from 'react'
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Gift, Plus, Loader2, Trash2, Coins, AlertTriangle } from 'lucide-react'
import Papa from 'papaparse'
import { extractTextFromFile, getFileType, getFileIcon, formatFileSize } from '../utils/documentParser'
import { formatRutWithDV, cleanRut, calculateRutDV } from '../utils/rutUtils'
import { toast } from 'sonner'

export default function CrearRecompensaPanel({ courses }: { courses: any[] }) {
    const createReward = useMutation(api.rewards.createReward)
    const deleteReward = useMutation(api.rewards.deleteReward)
    const [formData, setFormData] = useState({ course_id: '', name: '', description: '', cost: '', stock: '' })
    const [creating, setCreating] = useState(false)
    const [success, setSuccess] = useState('')
    const [subTab, setSubTab] = useState<'recomendadas' | 'manual'>('recomendadas')

    // Obtener recompensas existentes para el ramo seleccionado
    const existingRewards = useQuery(api.rewards.getRewardsByCourse,
        formData.course_id ? { course_id: formData.course_id as any } : "skip"
    )

    const handleDelete = async (e: React.MouseEvent, rewardId: any) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('--- Intentando eliminar recompensa (panel) ---', rewardId)
        if (window.confirm('¿Estás seguro de que quieres borrar esta recompensa?')) {
            try {
                await deleteReward({ reward_id: rewardId })
                console.log('>>> Éxito al eliminar recompensa (panel)')
            } catch (err: any) {
                console.error('!!! Error al eliminar recompensa (panel):', err)
                toast.error('Fallo al eliminar: ' + (err.message || String(err)))
            }
        }
    }

    // Catálogo de recompensas recomendadas
    const REWARD_TEMPLATES = [
        {
            category: '🎓 Académicas',
            color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
            items: [
                { name: 'Punto Extra en Prueba', description: 'Obtén 1 punto extra en tu próxima evaluación parcial.', cost: 500, stock: 10, emoji: '📝' },
                { name: 'Extensión de Plazo (24h)', description: 'Extiende la fecha de entrega de una tarea en 24 horas.', cost: 300, stock: 15, emoji: '⏰' },
                { name: 'Pregunta Eliminada', description: 'Elimina la pregunta con menor puntaje de tu última prueba.', cost: 800, stock: 5, emoji: '❌' },
                { name: 'Nota Mínima 4.0', description: 'Garantiza nota mínima 4.0 en un control sorpresa.', cost: 1000, stock: 3, emoji: '🛡️' },
                { name: 'Revisión Extra de Trabajo', description: 'El docente revisa tu borrador antes de la entrega final.', cost: 400, stock: 8, emoji: '🔍' },
                { name: 'Material de Estudio Extra', description: 'Acceso a material complementario exclusivo del ramo.', cost: 200, stock: 20, emoji: '📚' },
            ]
        },
        {
            category: '🎉 Sociales',
            color: 'from-green-500/20 to-green-600/10 border-green-500/20',
            items: [
                { name: 'Elegir Compañero de Grupo', description: 'Elige un compañero para el próximo trabajo grupal.', cost: 350, stock: 10, emoji: '👥' },
                { name: 'Presentar Tema Libre (5 min)', description: 'Presenta un tema de tu interés durante 5 minutos en clase.', cost: 250, stock: 5, emoji: '🎤' },
                { name: 'Skip de Asistencia', description: 'Una inasistencia justificada sin necesidad de certificado.', cost: 600, stock: 5, emoji: '🏠' },
                { name: 'Privilegio de Asiento', description: 'Elige tu puesto en la sala durante una semana.', cost: 150, stock: 8, emoji: '💺' },
            ]
        },
        {
            category: '⚡ Experiencias',
            color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
            items: [
                { name: 'Café con el Profe', description: 'Sesión de mentoría informal de 15 min con el docente.', cost: 450, stock: 5, emoji: '☕' },
                { name: 'Insignia Digital "Top Student"', description: 'Badge exclusivo visible en tu perfil del ramo.', cost: 700, stock: 10, emoji: '🏆' },
                { name: 'Certificado de Excelencia', description: 'Certificado digital de destacado rendimiento en gamificación.', cost: 1500, stock: 3, emoji: '🎖️' },
                { name: 'Tutor por un Día', description: 'Ayuda a un compañero como tutor oficial con reconocimiento.', cost: 300, stock: 8, emoji: '🧑‍🏫' },
            ]
        },
    ]

    const handleAddTemplate = async (template: any) => {
        if (!formData.course_id) {
            toast.error('Selecciona un ramo primero.')
            return
        }
        setCreating(true)
        try {
            await createReward({
                course_id: formData.course_id as any,
                name: template.name,
                description: template.description,
                cost: template.cost,
                stock: template.stock,
            })
            setSuccess(`✅ "${template.name}" agregada al ramo.`)
            setTimeout(() => setSuccess(''), 3000)
        } catch (err: any) {
            toast.error(err.message || 'Error al crear la recompensa')
        } finally {
            setCreating(false)
        }
    }

    const handleCreate = async () => {
        if (!formData.course_id || !formData.name || !formData.cost || !formData.stock) return
        setCreating(true)
        try {
            await createReward({
                course_id: formData.course_id as any,
                name: formData.name,
                description: formData.description,
                cost: parseInt(formData.cost),
                stock: parseInt(formData.stock),
            })
            setSuccess(`✅ Recompensa "${formData.name}" creada.`)
            setFormData({ course_id: formData.course_id, name: '', description: '', cost: '', stock: '' })
            setTimeout(() => setSuccess(''), 4000)
        } catch (err: any) {
            toast.error(err.message || 'Error al crear la recompensa')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div>
            <p className="text-slate-400 mb-6">Define premios que tus alumnos podrán canjear con sus puntos. Usa las recompensas recomendadas o crea las tuyas.</p>

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 text-sm font-medium">{success}</p>
                </div>
            )}

            {/* Selector de ramo (global para todo el panel) */}
            <div className="bg-surface-light border border-white/5 rounded-2xl p-6 mb-6">
                <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo destino</label>
                <select
                    value={formData.course_id}
                    onChange={e => setFormData({ ...formData, course_id: e.target.value })}
                    className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                    aria-label="Selecciona un ramo para agregar recompensas"
                >
                    <option value="">Selecciona un ramo</option>
                    {courses.map((c: any) => (
                        <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))}
                </select>

                {/* Recompensas ya existentes en este ramo */}
                {formData.course_id && (
                    <div className="mt-6 pt-6 border-t border-white/5">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Recompensas actuales en este ramo</h4>
                        {existingRewards === undefined ? (
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" /> Cargando premios...
                            </div>
                        ) : existingRewards.length === 0 ? (
                            <p className="text-slate-500 text-sm italic">No hay recompensas creadas para este ramo aún.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {existingRewards.map((r: any) => (
                                    <div key={r._id} className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center justify-between group">
                                        <div className="min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{r.name}</p>
                                            <p className="text-accent-light text-[10px] font-mono">{r.cost} pts · Stock: {r.stock}</p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, r._id)}
                                            className="p-2 text-slate-500 hover:text-red-400 bg-white/5 hover:bg-red-400/10 rounded-xl transition-all z-30 flex items-center justify-center pointer-events-auto"
                                            title="Borrar recompensa"
                                            type="button"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setSubTab('recomendadas')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${subTab === 'recomendadas' ? 'bg-gradient-to-r from-accent to-primary text-white shadow-lg shadow-accent/20' : 'bg-surface-light text-slate-400 border border-white/10 hover:text-white'}`}
                >
                    <Sparkles className="w-4 h-4" />
                    Recompensas Recomendadas
                </button>
                <button
                    onClick={() => setSubTab('manual')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${subTab === 'manual' ? 'bg-gradient-to-r from-gold to-gold-light text-surface shadow-lg shadow-gold/20' : 'bg-surface-light text-slate-400 border border-white/10 hover:text-white'}`}
                >
                    <Gift className="w-4 h-4" />
                    Crear Recompensa Manual
                </button>
            </div>

            {subTab === 'recomendadas' && (
                <>
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-accent-light" />
                        Recompensas Recomendadas
                    </h3>
                    <p className="text-slate-500 text-sm mb-6">Haz clic en <strong className="text-slate-300">+ Agregar</strong> para añadir una recompensa al ramo seleccionado.</p>

                    <div className="space-y-6 mb-8">
                        {REWARD_TEMPLATES.map((cat, ci) => (
                            <div key={ci}>
                                <h4 className="text-white font-semibold mb-3">{cat.category}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {cat.items.map((item, ii) => (
                                        <div key={ii} className={`bg-gradient-to-br ${cat.color} border rounded-xl p-4 flex items-start gap-3 group hover:scale-[1.01] transition-all`}>
                                            <span className="text-2xl shrink-0 mt-0.5">{item.emoji}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium text-sm">{item.name}</p>
                                                <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{item.description}</p>
                                                <div className="flex gap-3 mt-2 text-xs">
                                                    <span className="text-accent-light font-semibold">{item.cost} pts</span>
                                                    <span className="text-slate-500">Stock: {item.stock}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAddTemplate(item)}
                                                disabled={creating || !formData.course_id}
                                                className="shrink-0 bg-accent/20 hover:bg-accent/40 text-accent-light text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                title={`Agregar "${item.name}" al ramo`}
                                            >
                                                + Agregar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {subTab === 'manual' && (
                <div className="bg-surface-light border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-gold" />
                        Crear Recompensa Personalizada
                    </h3>
                    <p className="text-slate-500 text-sm mb-6">Agrega manualmente una recompensa única que no esté en el catálogo recomendado.</p>

                    <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Nombre del Premio</label>
                        <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="ej. Punto Extra en Prueba" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Descripción</label>
                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Detalle del beneficio..." className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary h-20 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-2 block">Costo (pts)</label>
                            <input type="number" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} placeholder="500" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-2 block">Stock</label>
                            <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} placeholder="10" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                        </div>
                    </div>
                    <button onClick={handleCreate} disabled={creating || !formData.course_id || !formData.name || !formData.cost || !formData.stock} className="bg-gradient-to-r from-gold to-gold-light text-surface font-bold px-6 py-3 rounded-xl transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Gift className="w-5 h-5" />}
                        {creating ? 'Creando...' : 'Crear Recompensa'}
                    </button>
                </div>
            )}
        </div>
    )
}
