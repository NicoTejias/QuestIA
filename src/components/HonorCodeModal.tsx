import { Shield, Check, X } from 'lucide-react'

interface HonorCodeModalProps {
  isOpen: boolean
  onAccept: () => void
  onDecline: () => void
  title?: string
  context?: 'quiz' | 'game'
}

const HONOR_CODE_TEXT = `Como estudiante de QuestIA, me comprometo a:
• Actuar con honestidad en todas mis actividades
• Presentar solo mi propio trabajo
• No buscar ventajas desleales
• Respetar la integridad académica

Entiendo que cualquier violación será reportada y podrá tener consecuencias académicas.`

export default function HonorCodeModal({ 
  isOpen, 
  onAccept, 
  onDecline,
  title = "Código de Honor",
  context = "quiz"
}: HonorCodeModalProps) {
  

  if (!isOpen) return null

  const handleAccept = () => {
    onAccept()
  }

  const contextText = context === 'game' 
    ? "para comenzar este juego" 
    : "para comenzar este quiz"

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface border border-white/10 rounded-[2rem] max-w-lg w-full p-6 md:p-8 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">{title}</h2>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 max-h-48 overflow-y-auto">
          <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{HONOR_CODE_TEXT}</p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
          <p className="text-xs text-amber-300 text-center">
            ⚠️ Al continuar, aceptas este compromiso {contextText}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 py-3 px-4 bg-white/5 border border-white/10 text-slate-400 font-bold rounded-xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-3 px-4 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Acepto
          </button>
        </div>
      </div>
    </div>
  )
}