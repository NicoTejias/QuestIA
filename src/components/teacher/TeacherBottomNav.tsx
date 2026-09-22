import { useState } from 'react'
import { LayoutDashboard, BookOpen, Sparkles, ArrowRightLeft, MoreHorizontal, Package, Archive, User, X } from 'lucide-react'

interface TeacherBottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onOpenMoreMenu?: () => void;
}

export default function TeacherBottomNav({
    activeTab,
    setActiveTab,
}: TeacherBottomNavProps) {
    const [moreOpen, setMoreOpen] = useState(false)

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId)
        setMoreOpen(false)
    }

    const mainItems = [
        { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
        { id: 'ramos', label: 'Ramos', icon: BookOpen },
        { id: 'desafios', label: 'Desafíos IA', icon: Sparkles },
        { id: 'canjes', label: 'Canjes', icon: ArrowRightLeft },
    ]

    const secondaryItems = [
        { id: 'material', label: 'Material & Guías', icon: BookOpen },
        { id: 'panol', label: 'Pañol de Herramientas', icon: Package },
        { id: 'cierre', label: 'Cierre de Semestre', icon: Archive },
        { id: 'perfil', label: 'Mi Perfil', icon: User },
    ]

    return (
        <>
            {/* Sheet modal when 'Más' is pressed */}
            {moreOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden flex flex-col justify-end animate-in fade-in duration-200">
                    <div className="bg-ink-soft border-t border-white/10 rounded-t-3xl p-5 pb-safe space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                            <span className="text-sm font-bold text-white uppercase tracking-wider">Más Herramientas Docentes</span>
                            <button
                                onClick={() => setMoreOpen(false)}
                                className="p-1 rounded-lg bg-white/5 text-quiet hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            {secondaryItems.map((item) => {
                                const Icon = item.icon
                                const active = activeTab === item.id
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleTabClick(item.id)}
                                        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${
                                            active
                                                ? 'bg-iris/20 border-iris text-white font-bold'
                                                : 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-iris/15 flex items-center justify-center text-iris-light shrink-0">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs">{item.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Bar */}
            <nav
                aria-label="Navegación móvil docente"
                className="fixed bottom-0 inset-x-0 z-40 bg-ink-soft/95 backdrop-blur-2xl border-t border-white/10 lg:hidden px-2 py-1.5 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
            >
                <div className="flex items-center justify-around max-w-lg mx-auto">
                    {mainItems.map((item) => {
                        const Icon = item.icon
                        const active = activeTab === item.id

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleTabClick(item.id)}
                                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[56px] min-h-[48px] transition-all relative ${
                                    active ? 'text-iris-light scale-105' : 'text-quiet hover:text-slate-200'
                                }`}
                            >
                                {active && (
                                    <span className="absolute -top-1.5 w-6 h-1 rounded-full bg-iris shadow-sm shadow-iris/80"></span>
                                )}
                                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                                <span className={`text-[10px] tracking-tight mt-1 font-bold ${active ? 'text-white' : 'text-quiet'}`}>
                                    {item.label}
                                </span>
                            </button>
                        )
                    })}

                    {/* Más Button */}
                    <button
                        onClick={() => setMoreOpen(!moreOpen)}
                        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[56px] min-h-[48px] transition-all relative ${
                            moreOpen || secondaryItems.some(i => i.id === activeTab) ? 'text-iris-light scale-105' : 'text-quiet hover:text-slate-200'
                        }`}
                    >
                        {(moreOpen || secondaryItems.some(i => i.id === activeTab)) && (
                            <span className="absolute -top-1.5 w-6 h-1 rounded-full bg-iris shadow-sm shadow-iris/80"></span>
                        )}
                        <MoreHorizontal className="w-5 h-5 stroke-[1.75px]" />
                        <span className="text-[10px] tracking-tight mt-1 font-bold">Más</span>
                    </button>
                </div>
            </nav>
        </>
    )
}
