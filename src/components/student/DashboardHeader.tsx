import { Menu, Coins } from 'lucide-react'
import NotificationBell from '../NotificationBell'
import BetaBanner from '../BetaBanner'

interface DashboardHeaderProps {
    setSidebarOpen: (open: boolean) => void;
    activeTab: string;
    tabs: any[];
    selectedCourseId: string | null;
    totalSpendablePoints: number;
}

export default function DashboardHeader({
    setSidebarOpen,
    activeTab,
    tabs,
    selectedCourseId,
    totalSpendablePoints
}: DashboardHeaderProps) {
    return (
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 pt-safe flex flex-col shrink-0">
            <div className="flex items-center justify-between py-3 md:py-4">

            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white shrink-0" title="Abrir panel de navegación">
                    <Menu className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-base md:text-xl font-bold text-white capitalize leading-none mb-1 truncate">
                        {selectedCourseId ? 'Detalle del Ramo' : tabs.find(t => t.id === activeTab)?.label}
                    </h1>
                    <p className="hidden xs:block text-[8px] md:text-[10px] text-primary font-black uppercase tracking-widest truncate italic">
                        {selectedCourseId ? 'Contenido y Desafíos • QuestIA' : 'Identidad QuestIA'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <BetaBanner className="hidden lg:flex" />
                <NotificationBell />
                <div className="flex items-center gap-2 md:gap-3 bg-white/5 rounded-xl md:rounded-2xl px-3 md:px-4 py-1.5 md:py-2 border border-white/10 shrink-0">
                    <div className="flex flex-col items-end">
                        <span className="hidden sm:block text-[8px] md:text-[10px] text-slate-500 font-bold leading-none mb-1">SALDO ACTUAL</span>
                        <span className="text-gold font-black text-xs md:text-sm leading-none">{totalSpendablePoints.toLocaleString()} <span className="hidden xs:inline">PTS</span></span>
                    </div>
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-gold/20 rounded-lg flex items-center justify-center">
                        <Coins className="w-3.5 h-3.5 md:w-4 md:h-4 text-gold" />
                    </div>
                </div>
                </div>
            </div>
        </header>
    )
}
