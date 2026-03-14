import { useState, useRef, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Send, Loader2, User, MessageSquare } from 'lucide-react'

interface ChatPanelProps {
    courseId: any;
    currentUserId: any;
}

export default function ChatPanel({ courseId, currentUserId }: ChatPanelProps) {
    const messages = useQuery(api.messages.getByCourse, { course_id: courseId })
    const sendMessage = useMutation(api.messages.send)
    const [newMessage, setNewMessage] = useState("")
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        try {
            await sendMessage({ course_id: courseId, content: newMessage.trim() })
            setNewMessage("")
        } catch (err) {
            console.error(err)
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="flex flex-col h-[500px] md:h-[600px] bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-primary-light" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">Chat del Ramo</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Canal de colaboración</p>
                </div>
            </div>

            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar"
            >
                {!messages ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                        <MessageSquare className="w-12 h-12 mb-2" />
                        <p className="text-sm font-medium">No hay mensajes aún.</p>
                        <p className="text-[10px] uppercase">¡Sé el primero en saludar!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.user_id === currentUserId
                        return (
                            <div 
                                key={msg._id} 
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'ml-auto' : 'mr-auto'}`}
                            >
                                <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[100px]">
                                        {msg.userName}
                                    </span>
                                    <span className="text-[8px] text-slate-600 font-mono">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                    isMe 
                                        ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10' 
                                        : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'
                                }`}>
                                    {msg.content}
                                </div>
                                <div className={`mt-1 flex items-center gap-1.5 px-1 ${isMe ? 'flex-row-reverse text-right' : ''}`}>
                                    <span className={`text-[8px] font-bold uppercase tracking-tighter ${msg.userRole === 'teacher' ? 'text-accent-light' : 'text-primary-light'}`}>
                                        {msg.userRole === 'teacher' ? 'DOCENTE' : msg.belbinRole}
                                    </span>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/5">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-primary/50 transition-all font-medium"
                    />
                    <button 
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="w-11 h-11 bg-primary hover:bg-primary-light disabled:opacity-50 disabled:bg-slate-800 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </form>
        </div>
    )
}
