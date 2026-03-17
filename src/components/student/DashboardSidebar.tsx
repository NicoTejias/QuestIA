import { BookOpen, X, Trophy, Coins, Flame, LogOut, ArrowRightLeft } from 'lucide-react'

interface DashboardSidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    user: any;
    userName: string;
    belbinRole: string;
    totalRankingPoints: number;
    totalSpendablePoints: number;
    tabs: any[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    selectedCourseId: string | null;
    setSelectedCourseId: (id: string | null) => void;
    setShowTransferModal: (show: boolean) => void;
    handleLogout: () => void;
}

export default function DashboardSidebar({
    sidebarOpen,
    setSidebarOpen,
    user,
    userName,
    belbinRole,
    totalRankingPoints,
    totalSpendablePoints,
    tabs,
    activeTab,
    setActiveTab,
    selectedCourseId,
    setSelectedCourseId,
    setShowTransferModal,
    handleLogout
}: DashboardSidebarProps) {
    return (
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface-light border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Fixed Header */}
            <div className="p-6 border-b border-white/5 shrink-0 pt-safe">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white tracking-tight">Quest</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white" title="Cerrar panel de navegación">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Scrollable Middle Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                {/* User Mini Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center text-xl shadow-inner overflow-hidden border border-white/10 shrink-0">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <img src="/avatars/duco.png" alt="Duco" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="overflow-hidden min-w-0">
                            <p className="text-white font-bold text-sm truncate">{userName}</p>
                            <p className="text-primary-light text-[10px] font-black uppercase tracking-widest">{belbinRole}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-black/20 rounded-xl p-2 border border-white/5">
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Ranking</p>
                            <div className="flex items-center gap-1">
                                <Trophy className="w-3 h-3 text-gold" />
                                <span className="text-xs font-black text-white">{totalRankingPoints.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="bg-black/20 rounded-xl p-2 border border-white/5">
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Canjeable</p>
                            <div className="flex items-center gap-1">
                                <Coins className="w-3 h-3 text-gold" />
                                <span className="text-xs font-black text-white">{totalSpendablePoints.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-500/10 to-gold/10 rounded-xl p-2.5 border border-orange-500/20 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-500 mb-0.5" />
                            <span className="text-[10px] text-orange-400 font-bold uppercase">Racha Actual</span>
                        </div>
                        <span className="text-sm font-black text-orange-400">{user.daily_streak || 0} 🔥</span>
                    </div>

                    {user?.ice_cubes !== undefined && user.ice_cubes > 0 && (
                        <div className="mt-2 bg-cyan-500/10 rounded-xl p-2.5 border border-cyan-500/20 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-cyan-400 rounded-sm rotate-45 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                                <span className="text-[10px] text-cyan-400 font-bold uppercase">Escudos Racha</span>
                            </div>
                            <span className="text-sm font-black text-cyan-400">x{user.ice_cubes}</span>
                        </div>
                    )}
                </div>

                <nav className="space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSelectedCourseId(null); setSidebarOpen(false) }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-medium group
                                ${activeTab === tab.id && !selectedCourseId
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className={`text-base ${activeTab === tab.id && !selectedCourseId ? 'text-white' : 'group-hover:text-primary-light'}`}>
                                {tab.icon}
                            </span>
                            <span className="text-sm">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="pt-4">
                    <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 opacity-50">Acciones Rápidas</p>
                    <button
                        onClick={() => setShowTransferModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-accent-light hover:bg-accent/5 transition-all font-medium group"
                    >
                        <ArrowRightLeft className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-sm text-slate-400 group-hover:text-white transition-colors">Transferir Puntos</span>
                    </button>
                </div>
            </div>

            {/* Fixed Footer */}
            <div className="p-4 border-t border-white/5 shrink-0 bg-surface-light/50 backdrop-blur-sm pb-safe">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all font-bold text-xs uppercase tracking-widest">
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                </button>
                <div className="px-4 py-1 flex items-center justify-between opacity-30 transition-opacity">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">v1.0.11</span>
                    <span className="text-[9px] font-medium text-slate-600">Quest</span>
                </div>
            </div>
        </aside>
    )
}
