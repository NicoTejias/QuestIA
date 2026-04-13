import { useState, useEffect } from 'react'
import { FaqAPI } from '../../lib/api'
import { Plus, Trash2, Edit2, Save, X, Loader2, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function FAQManager() {
    const [faqs, setFaqs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: 'general',
        order: 0
    })

    useEffect(() => {
        FaqAPI.getFaqs()
            .then(setFaqs)
            .catch(console.error)
            .finally(() => setIsLoading(false))
    }, [])

    const resetForm = () => {
        setFormData({ question: '', answer: '', category: 'general', order: faqs.length })
        setEditingId(null)
        setIsAdding(false)
    }

    const handleSave = async () => {
        if (!formData.question || !formData.answer) {
            toast.error("Pregunta y respuesta son obligatorias")
            return
        }

        try {
            if (editingId) {
                await FaqAPI.updateFaq(editingId, formData)
                setFaqs(prev => prev.map(f => f.id === editingId ? { ...f, ...formData } : f))
                toast.success("FAQ actualizada")
            } else {
                await FaqAPI.createFaq(formData)
                FaqAPI.getFaqs().then(setFaqs).catch(console.error)
                toast.success("FAQ creada")
            }
            resetForm()
        } catch (err: any) {
            toast.error("Error: " + err.message)
        }
    }

    const handleEdit = (faq: any) => {
        setFormData({
            question: faq.question,
            answer: faq.answer,
            category: faq.category || 'general',
            order: faq.order
        })
        setEditingId(faq.id)
        setIsAdding(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta pregunta?")) return
        try {
            await FaqAPI.deleteFaq(id)
            setFaqs(prev => prev.filter(f => f.id !== id))
            toast.success("FAQ eliminada")
        } catch (err: any) {
            toast.error("Error: " + err.message)
        }
    }

    if (isLoading) return <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <HelpCircle className="w-6 h-6 text-primary" />
                    Gestión de FAQ
                </h3>
                {!isAdding && !editingId && (
                    <button 
                        onClick={() => { setIsAdding(true); setFormData({ ...formData, order: faqs.length }); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary-light border border-primary/20 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Pregunta
                    </button>
                )}
            </div>

            {(isAdding || editingId) && (
                <div className="bg-surface-light border border-primary/20 rounded-3xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Pregunta</label>
                            <input 
                                type="text" 
                                value={formData.question}
                                onChange={e => setFormData({ ...formData, question: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/40 transition-all"
                                placeholder="¿Cómo funciona...?"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Categoría</label>
                            <select 
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/40 transition-all appearance-none"
                            >
                                <option value="general">General</option>
                                <option value="alumno">Alumnos</option>
                                <option value="docente">Docentes</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Respuesta</label>
                        <textarea 
                            value={formData.answer}
                            onChange={e => setFormData({ ...formData, answer: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/40 transition-all h-32 resize-none"
                            placeholder="La plataforma permite..."
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={resetForm}
                            className="px-6 py-2 text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                        >
                            <X className="w-4 h-4 inline mr-2" />
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSave}
                            className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Guardar FAQ
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-surface-light border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
                {faqs.map((faq: any) => (
                    <div key={faq.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                                    faq.category === 'alumno' ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' :
                                    faq.category === 'docente' ? 'text-gold border-gold/20 bg-gold/5' :
                                    'text-slate-400 border-white/10 bg-white/5'
                                } uppercase`}>
                                    {faq.category || 'general'}
                                </span>
                                <p className="text-white text-sm font-bold truncate">{faq.question}</p>
                            </div>
                            <p className="text-slate-500 text-xs truncate">{faq.answer}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleEdit(faq)}
                                className="p-2 text-slate-400 hover:text-primary-light transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleDelete(faq.id)}
                                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {faqs.length === 0 && !isAdding && (
                    <div className="p-12 text-center text-slate-500 italic text-sm">
                        No hay preguntas frecuentes registradas.
                    </div>
                )}
            </div>
        </div>
    )
}