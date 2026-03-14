import { Target } from 'lucide-react'

interface MisionesPanelProps {
    courses: any[];
    onSelectCourse: (id: string) => void;
}

export default function MisionesPanel({ courses, onSelectCourse }: MisionesPanelProps) {
    return (
        <div className="max-w-4xl mx-auto py-10 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                <Target className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">Misiones Activas</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">
                Selecciona un ramo para ver tus desafíos pendientes y ganar recompensas.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
                {(courses || []).map(c => (
                    <button
                        key={c._id}
                        onClick={() => onSelectCourse(c._id)}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:border-primary/50 text-white font-bold transition-all"
                    >
                        {c.name}
                    </button>
                ))}
            </div>
        </div>
    )
}
