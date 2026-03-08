import { useState, useEffect } from 'react'
import { X, Loader2, Save } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { toast } from 'sonner'

interface EditModalProps {
    isOpen: boolean
    onClose: () => void
    data: any
}

export function EditCourseModal({ isOpen, onClose, data }: EditModalProps) {
    const updateCourse = useMutation(api.courses.updateCourse)
    const [formData, setFormData] = useState({ name: '', code: '', description: '' })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (data) setFormData({ name: data.name, code: data.code, description: data.description || '' })
    }, [data])

    const handleSave = async () => {
        setLoading(true)
        try {
            await updateCourse({
                course_id: data._id,
                name: formData.name,
                code: formData.code,
                description: formData.description
            })
            toast.success('Ramo actualizado con éxito')
            onClose()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-surface-light border border-white/10 rounded-[2.5rem] max-w-xl w-full p-8 md:p-10 shadow-2xl relative animate-in zoom-in duration-300">
                <button onClick={onClose} title="Cerrar modal" className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                        <Save className="w-5 h-5 text-accent-light" />
                    </div>
                    Editar Ramo
                </h3>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Nombre del Ramo</label>
                        <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-accent/50 outline-none transition-all font-bold" title="Nombre del ramo" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Código</label>
                        <input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="Código" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-accent/50 outline-none transition-all font-mono" title="Código" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Descripción</label>
                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-accent/50 outline-none transition-all h-32 resize-none" title="Descripción" />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={onClose} className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/10 uppercase tracking-widest text-xs" title="Cancelar edición">
                            Cancelar
                        </button>
                        <button onClick={handleSave} disabled={loading} className="flex-1 px-6 py-4 bg-accent hover:bg-accent-light text-white font-black rounded-2xl transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs" title="Guardar cambios">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function EditMissionModal({ isOpen, onClose, data }: EditModalProps) {
    const updateMission = useMutation(api.missions.updateMission)
    const [formData, setFormData] = useState({ title: '', description: '', points: 0 })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (data) setFormData({ title: data.title, description: data.description, points: data.points })
    }, [data])

    const handleSave = async () => {
        setLoading(true)
        try {
            await updateMission({
                mission_id: data._id,
                title: formData.title,
                description: formData.description,
                points: Number(formData.points)
            })
            toast.success('Misión actualizada')
            onClose()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-surface-light border border-white/10 rounded-[2.5rem] max-w-xl w-full p-8 md:p-10 shadow-2xl relative animate-in zoom-in duration-300">
                <button onClick={onClose} title="Cerrar modal" className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                        <Save className="w-5 h-5 text-primary-light" />
                    </div>
                    Editar Misión
                </h3>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Título</label>
                        <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Título" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-primary/50 outline-none transition-all font-bold" title="Título de la misión" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Descripción</label>
                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-primary/50 outline-none transition-all h-24 resize-none" title="Descripción" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Puntos</label>
                        <input type="number" value={formData.points} onChange={e => setFormData({ ...formData, points: Number(e.target.value) })} placeholder="Puntos" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-primary/50 outline-none transition-all font-black text-xl" title="Puntos otorgados" />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={onClose} className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/10 uppercase tracking-widest text-xs" title="Cancelar edición">
                            Cancelar
                        </button>
                        <button onClick={handleSave} disabled={loading} className="flex-1 px-6 py-4 bg-primary hover:bg-primary-light text-white font-black rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs" title="Guardar cambios">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function EditRewardModal({ isOpen, onClose, data }: EditModalProps) {
    const updateReward = useMutation(api.rewards.updateReward)
    const [formData, setFormData] = useState({ name: '', description: '', cost: 0, stock: 0 })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (data) setFormData({ name: data.name, description: data.description, cost: data.cost, stock: data.stock })
    }, [data])

    const handleSave = async () => {
        setLoading(true)
        try {
            await updateReward({
                reward_id: data._id,
                name: formData.name,
                description: formData.description,
                cost: Number(formData.cost),
                stock: Number(formData.stock)
            })
            toast.success('Recompensa actualizada')
            onClose()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-surface-light border border-white/10 rounded-[2.5rem] max-w-xl w-full p-8 md:p-10 shadow-2xl relative animate-in zoom-in duration-300">
                <button onClick={onClose} title="Cerrar modal" className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center">
                        <Save className="w-5 h-5 text-gold" />
                    </div>
                    Editar Recompensa
                </h3>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Nombre</label>
                        <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-gold/50 outline-none transition-all font-bold" title="Nombre de la recompensa" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Descripción</label>
                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-gold/50 outline-none transition-all h-24 resize-none" title="Descripción" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Costo (Pts)</label>
                            <input type="number" value={formData.cost} onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })} placeholder="Costo" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-gold/50 outline-none transition-all font-black text-xl" title="Costo en puntos" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Stock</label>
                            <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} placeholder="Stock" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-gold/50 outline-none transition-all font-black text-xl" title="Stock disponible" />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={onClose} className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/10 uppercase tracking-widest text-xs" title="Cancelar edición">
                            Cancelar
                        </button>
                        <button onClick={handleSave} disabled={loading} className="flex-1 px-6 py-4 bg-gold hover:bg-gold-light text-white font-black rounded-2xl transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs" title="Guardar cambios">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
