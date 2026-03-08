import { X, AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
    loading?: boolean
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    loading = false
}: ConfirmModalProps) {
    if (!isOpen) return null

    const colors = {
        danger: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
        warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
        info: 'bg-primary hover:bg-primary-light shadow-primary/20'
    }

    const iconColors = {
        danger: 'text-red-400 bg-red-400/10',
        warning: 'text-amber-400 bg-amber-400/10',
        info: 'text-primary-light bg-primary/10'
    }

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-surface-light border border-white/10 rounded-[2rem] max-w-md w-full p-8 shadow-2xl relative animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    title="Cerrar"
                    className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${iconColors[variant]}`}>
                        <AlertTriangle className="w-8 h-8" />
                    </div>

                    <h3 className="text-2xl font-black text-white mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">{message}</p>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => { onConfirm(); onClose() }}
                            disabled={loading}
                            className={`px-6 py-3 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 ${colors[variant]}`}
                        >
                            {loading ? 'Procesando...' : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
