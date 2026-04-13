import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { AdminAPI } from '../lib/api'
import { MessageSquare, X, Send, Loader2, AlertCircle, Lightbulb, Heart, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function FeedbackButton() {
    const { user: clerkUser } = useUser()
    const [isOpen, setIsOpen] = useState(false)
    const [type, setType] = useState<'bug' | 'suggestion' | 'opinion'>('opinion')
    const [content, setContent] = useState('')
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const [sending, setSending] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length + selectedFiles.length > 5) {
            toast.error('Máximo 5 imágenes por feedback')
            return
        }

        setSelectedFiles(prev => [...prev, ...files])
        const newPreviews = files.map(f => URL.createObjectURL(f))
        setPreviews(prev => [...prev, ...newPreviews])
    }

    const removeFile = (index: number) => {
        URL.revokeObjectURL(previews[index])
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim() || sending || !clerkUser) return

        setSending(true)
        try {
            await AdminAPI.sendFeedback({
                content: content.trim(),
                type,
                page_url: window.location.href,
                image_urls: []
            }, clerkUser.id)

            toast.success('¡Gracias por tu feedback! Lo revisaremos pronto.')
            setContent('')
            setSelectedFiles([])
            setPreviews([])
            setIsOpen(false)
        } catch (err: any) {
            toast.error('Error al enviar: ' + err.message)
        } finally {
            setSending(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[60] bg-primary hover:bg-primary-light text-white p-4 rounded-full shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all group border border-white/20"
                title="Danos tu feedback"
            >
                <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    
                    <div className="relative bg-surface-light border border-white/10 rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />
                        
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-white">Tu Opinión Importa</h2>
                                <p className="text-slate-400 text-sm mt-1 italic">Ayúdanos a mejorar <span className="text-primary font-bold">QuestIA</span> con tus ideas.</p>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex gap-2">
                                {[
                                    { id: 'bug', label: 'Fallo', icon: <AlertCircle className="w-4 h-4" />, color: 'peer-checked:bg-red-500/20 peer-checked:text-red-400 peer-checked:border-red-500/40' },
                                    { id: 'suggestion', label: 'Sugerencia', icon: <Lightbulb className="w-4 h-4" />, color: 'peer-checked:bg-blue-500/20 peer-checked:text-blue-400 peer-checked:border-blue-500/40' },
                                    { id: 'opinion', label: 'Opinión', icon: <Heart className="w-4 h-4" />, color: 'peer-checked:bg-green-500/20 peer-checked:text-green-400 peer-checked:border-green-500/40' },
                                ].map((tab) => (
                                    <label key={tab.id} className="flex-1 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="type" 
                                            value={tab.id} 
                                            checked={type === tab.id}
                                            onChange={() => setType(tab.id as any)}
                                            className="sr-only peer" 
                                        />
                                        <div className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 transition-all ${tab.color}`}>
                                            {tab.icon}
                                            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                                    {type === 'bug' ? '¿Qué falló?' : type === 'suggestion' ? '¿Qué agregarías?' : 'Cuéntanos qué te parece'}
                                </label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={type === 'bug' ? "Describe el error paso a paso..." : "Escribe tus comentarios aquí..."}
                                    className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:border-primary/50 outline-none transition-all resize-none font-medium"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                                    SCREENSHOTS {selectedFiles.length > 0 && `(${selectedFiles.length}/5)`}
                                </label>
                                <div className="flex flex-wrap gap-3 p-3 bg-black/20 rounded-2xl border border-white/5">
                                    {previews.map((url, i) => (
                                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group border border-white/10 shadow-lg">
                                            <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                            <button 
                                                type="button"
                                                onClick={() => removeFile(i)}
                                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-5 h-5 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                    {selectedFiles.length < 5 && (
                                        <label className="w-20 h-20 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 hover:border-primary/50 transition-all text-slate-500 hover:text-white group">
                                            <input type="file" multiple accept="image/*" className="sr-only" onChange={handleFileChange} />
                                            <Plus className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                                            <span className="text-[8px] font-black uppercase tracking-tighter">Añadir</span>
                                        </label>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!content.trim() || sending}
                                className="w-full bg-primary hover:bg-primary-light text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                ENVIAR FEEDBACK
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}