import { LayoutDashboard, Target, BookOpen, Trophy, User } from 'lucide-react'

interface StudentBottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    selectedCourseId: string | null;
    setSelectedCourseId: (id: string | null) => void;
    pendingMissionsCount?: number;
}

export default function StudentBottomNav({
    activeTab,
    setActiveTab,
    selectedCourseId,
    setSelectedCourseId,
    pendingMissionsCount = 0,
}: StudentBottomNavProps) {
    const handleTabClick = (tabId: string) => {
        if (selectedCourseId) {
            setSelectedCourseId(null)
        }
        setActiveTab(tabId)
    }

    const navItems = [
        {
            id: 'inicio',
            label: 'Inicio',
            icon: LayoutDashboard,
            isActive: activeTab === 'inicio' && !selectedCourseId,
        },
        {
            id: 'misiones',
            label: 'Misiones',
            icon: Target,
            isActive: activeTab === 'misiones',
            badge: pendingMissionsCount > 0 ? pendingMissionsCount : undefined,
        },
        {
            id: 'ramos',
            label: 'Mis Ramos',
            icon: BookOpen,
            isActive: !!selectedCourseId,
            onClick: () => {
                setActiveTab('inicio')
                // Scrollear hacia los ramos o volver al inicio si estaba en detalle
                if (selectedCourseId) setSelectedCourseId(null)
            }
        },
        {
            id: 'ranking',
            label: 'Ranking',
            icon: Trophy,
            isActive: activeTab === 'ranking',
        },
        {
            id: 'perfil',
            label: 'Mi Perfil',
            icon: User,
            isActive: activeTab === 'perfil' || activeTab === 'tienda',
        },
    ]

    return (
        <nav
            aria-label="Navegación móvil"
            className="fixed bottom-0 inset-x-0 z-40 bg-ink-soft/95 backdrop-blur-2xl border-t border-white/10 lg:hidden px-2 py-1.5 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
        >
            <div className="flex items-center justify-around max-w-lg mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const active = item.isActive

                    return (
                        <button
                            key={item.id}
                            onClick={() => (item.onClick ? item.onClick() : handleTabClick(item.id))}
                            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[56px] min-h-[48px] transition-all relative ${
                                active ? 'text-iris-light scale-105' : 'text-quiet hover:text-slate-200'
                            }`}
                        >
                            {/* Active Indicator Bar on top */}
                            {active && (
                                <span className="absolute -top-1.5 w-6 h-1 rounded-full bg-iris shadow-sm shadow-iris/80"></span>
                            )}

                            <div className="relative">
                                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                                {item.badge && (
                                    <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center animate-pulse">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] tracking-tight mt-1 font-bold ${active ? 'text-white' : 'text-quiet'}`}>
                                {item.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}
