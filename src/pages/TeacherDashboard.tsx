import { useState, useRef } from 'react'
import { BookOpen, Target, Trophy, Gift, Users, Upload, Plus, BarChart3, LogOut, Menu, X, Settings, FileSpreadsheet, Coins, ChevronRight, Flame, Trash2, CheckCircle } from 'lucide-react'
import Papa from 'papaparse'

// Datos de demo
const DEMO_COURSES_T = [
    { id: '1', name: 'Electrotecnia I', code: 'ELT-101', students: 32 },
    { id: '2', name: 'Circuitos Digitales', code: 'CIR-201', students: 28 },
]

export default function TeacherDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('ramos')

    const tabs = [
        { id: 'ramos', label: 'Mis Ramos', icon: <BookOpen className="w-5 h-5" /> },
        { id: 'misiones', label: 'Misiones', icon: <Target className="w-5 h-5" /> },
        { id: 'ranking', label: 'Ranking', icon: <Trophy className="w-5 h-5" /> },
        { id: 'recompensas', label: 'Recompensas', icon: <Gift className="w-5 h-5" /> },
        { id: 'grupos', label: 'Grupos Inteligentes', icon: <Users className="w-5 h-5" /> },
        { id: 'whitelist', label: 'Whitelist (CSV)', icon: <FileSpreadsheet className="w-5 h-5" /> },
        { id: 'analiticas', label: 'Analíticas', icon: <BarChart3 className="w-5 h-5" /> },
    ]

    return (
        <div className="min-h-screen bg-surface flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface-light border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center">
                                <Settings className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="text-lg font-bold text-white block">Panel Docente</span>
                                <span className="text-xs text-slate-500">GestiónDocente</span>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-4">
                    <nav className="space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-medium text-sm
                  ${activeTab === tab.id
                                        ? 'bg-accent/10 text-accent-light border border-accent/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all font-medium text-sm">
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Main */}
            <main className="flex-1 min-h-screen">
                <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-white">{tabs.find(t => t.id === activeTab)?.label}</h1>
                    </div>
                </header>

                <div className="p-6">
                    {activeTab === 'ramos' && <RamosPanel />}
                    {activeTab === 'misiones' && <CrearMisionPanel />}
                    {activeTab === 'recompensas' && <CrearRecompensaPanel />}
                    {activeTab === 'whitelist' && <WhitelistPanel />}
                    {activeTab === 'grupos' && <GruposPanel />}
                    {activeTab === 'ranking' && <RankingDocentePanel />}
                    {activeTab === 'analiticas' && <AnaliticasPanel />}
                </div>
            </main>
        </div>
    )
}

// ======== Sub-componentes Docente ========

function RamosPanel() {
    const [showCreate, setShowCreate] = useState(false)
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <p className="text-slate-400">Gestiona tus ramos activos.</p>
                <button onClick={() => setShowCreate(!showCreate)} className="bg-accent hover:bg-accent-light text-white font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4" />
                    Nuevo Ramo
                </button>
            </div>

            {showCreate && (
                <div className="bg-surface-light border border-accent/20 rounded-2xl p-6 mb-6 space-y-4">
                    <h3 className="text-white font-bold">Crear Ramo</h3>
                    <input placeholder="Nombre del ramo (ej. Electrotecnia I)" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent" />
                    <input placeholder="Código (ej. ELT-101)" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent" />
                    <textarea placeholder="Descripción del ramo..." className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent h-24 resize-none" />
                    <button className="bg-accent text-white font-bold px-6 py-3 rounded-xl hover:bg-accent-light transition-all">Crear Ramo</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEMO_COURSES_T.map(c => (
                    <div key={c.id} className="bg-surface-light border border-white/5 rounded-2xl p-6 hover:border-accent/30 transition-all group cursor-pointer">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-accent-light transition-colors">{c.name}</h3>
                                <span className="text-xs text-slate-500 font-mono">{c.code}</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-accent-light" />
                        </div>
                        <div className="flex items-center gap-2 mt-4 text-slate-400 text-sm">
                            <Users className="w-4 h-4" /> {c.students} alumnos inscritos
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function CrearMisionPanel() {
    return (
        <div className="max-w-2xl">
            <p className="text-slate-400 mb-6">Crea misiones gamificadas para motivar a tus alumnos.</p>
            <div className="bg-surface-light border border-white/5 rounded-2xl p-6 space-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo</label>
                    <select className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary">
                        <option>Electrotecnia I (ELT-101)</option>
                        <option>Circuitos Digitales (CIR-201)</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Título de la Misión</label>
                    <input placeholder="ej. Quiz de Leyes de Kirchhoff" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Descripción</label>
                    <textarea placeholder="Describe la misión..." className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary h-24 resize-none" />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Puntos</label>
                    <input type="number" placeholder="100" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                </div>
                <button className="bg-primary hover:bg-primary-light text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 flex items-center gap-2">
                    <Flame className="w-5 h-5" />
                    Crear Misión
                </button>
            </div>
        </div>
    )
}

function CrearRecompensaPanel() {
    return (
        <div className="max-w-2xl">
            <p className="text-slate-400 mb-6">Define premios que tus alumnos podrán canjear con sus puntos.</p>
            <div className="bg-surface-light border border-white/5 rounded-2xl p-6 space-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo</label>
                    <select className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary">
                        <option>Electrotecnia I (ELT-101)</option>
                        <option>Circuitos Digitales (CIR-201)</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Nombre del Premio</label>
                    <input placeholder="ej. Punto Extra en Prueba" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Descripción</label>
                    <textarea placeholder="Detalle del beneficio..." className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary h-20 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Costo (pts)</label>
                        <input type="number" placeholder="500" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Stock</label>
                        <input type="number" placeholder="10" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                    </div>
                </div>
                <button className="bg-gradient-to-r from-gold to-gold-light text-surface font-bold px-6 py-3 rounded-xl transition-all active:scale-95 flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Crear Recompensa
                </button>
            </div>
        </div>
    )
}

function WhitelistPanel() {
    const fileRef = useRef<HTMLInputElement>(null)
    const [parsedData, setParsedData] = useState<string[]>([])
    const [fileName, setFileName] = useState('')

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setFileName(file.name)

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Sanitización: tomar solo la primera columna que parezca RUT/ID
                const identifiers = results.data
                    .map((row: any) => {
                        const values = Object.values(row) as string[]
                        return values[0]?.toString().trim()
                    })
                    .filter((id: string | undefined) => id && id.length > 3)
                setParsedData(identifiers as string[])
            },
            error: () => alert('Error al leer el archivo. Verifica el formato.')
        })
    }

    return (
        <div className="max-w-2xl">
            <p className="text-slate-400 mb-6">Sube un archivo CSV/Excel con los RUTs o matrículas de tus alumnos para habilitar la inscripción automática.</p>

            <div className="bg-surface-light border border-white/5 rounded-2xl p-6 space-y-5">
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo</label>
                    <select className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary">
                        <option>Electrotecnia I (ELT-101)</option>
                        <option>Circuitos Digitales (CIR-201)</option>
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Archivo CSV</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 bg-surface border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-accent/40 transition-all group">
                        <Upload className="w-8 h-8 text-slate-500 mb-2 group-hover:text-accent-light transition-colors" />
                        <span className="text-slate-400 text-sm">{fileName || 'Haz clic para subir tu archivo CSV'}</span>
                        <span className="text-slate-500 text-xs mt-1">.csv con una columna de identificadores</span>
                        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>

                {parsedData.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 text-success mb-3">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold text-sm">{parsedData.length} identificadores detectados</span>
                        </div>
                        <div className="bg-surface rounded-xl p-4 max-h-48 overflow-y-auto space-y-1">
                            {parsedData.map((id, i) => (
                                <div key={i} className="flex items-center justify-between text-sm py-1 px-3 rounded-lg hover:bg-white/5">
                                    <span className="text-slate-300 font-mono">{id}</span>
                                    <button className="text-slate-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            ))}
                        </div>
                        <button className="mt-4 bg-accent hover:bg-accent-light text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 w-full flex items-center justify-center gap-2">
                            <Upload className="w-5 h-5" />
                            Cargar Whitelist ({parsedData.length} alumnos)
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

function GruposPanel() {
    const demoGroups = [
        {
            id: 1, members: [
                { name: 'María F.', role: 'Cerebro', category: 'Mental', emoji: '🧠' },
                { name: 'Carlos R.', role: 'Impulsor', category: 'Acción', emoji: '⚡' },
                { name: 'Ana L.', role: 'Cohesionador', category: 'Social', emoji: '🤝' },
            ]
        },
        {
            id: 2, members: [
                { name: 'Pedro S.', role: 'Monitor', category: 'Mental', emoji: '🔍' },
                { name: 'Lucía M.', role: 'Implementador', category: 'Acción', emoji: '⚙️' },
                { name: 'Diego V.', role: 'Coordinador', category: 'Social', emoji: '👑' },
            ]
        },
    ]

    return (
        <div>
            <p className="text-slate-400 mb-6">Genera grupos equilibrados automáticamente basándose en los perfiles Belbin de tus alumnos.</p>

            <div className="flex gap-4 mb-8">
                <select className="bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary">
                    <option>Electrotecnia I (ELT-101)</option>
                </select>
                <input type="number" placeholder="Alumnos por grupo" defaultValue={3} className="bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white w-48 focus:outline-none focus:border-primary" />
                <button className="bg-gradient-to-r from-primary to-accent text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Generar Grupos
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {demoGroups.map(group => (
                    <div key={group.id} className="bg-surface-light border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-accent-light" />
                            Grupo {group.id}
                        </h3>
                        <div className="space-y-3">
                            {group.members.map((m, i) => (
                                <div key={i} className="flex items-center justify-between bg-surface rounded-xl px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{m.emoji}</span>
                                        <span className="text-white font-medium">{m.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-primary-light text-sm font-semibold block">{m.role}</span>
                                        <span className="text-slate-500 text-xs">{m.category}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function RankingDocentePanel() {
    return (
        <div>
            <p className="text-slate-400 mb-6">Vista del ranking de todos tus ramos.</p>
            <div className="bg-surface-light border border-white/5 rounded-2xl overflow-hidden">
                {[
                    { pos: 1, name: 'María Fernández', points: 2100, rut: '12.345.678-9' },
                    { pos: 2, name: 'Juan Estudiante', points: 1250, rut: '98.765.432-1' },
                    { pos: 3, name: 'Carlos Rojas', points: 1180, rut: '11.222.333-4' },
                ].map(s => (
                    <div key={s.pos} className="flex items-center justify-between px-6 py-4 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-4">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${s.pos === 1 ? 'bg-gold/20 text-gold' : 'bg-white/5 text-slate-500'}`}>{s.pos}</span>
                            <div>
                                <span className="text-white font-semibold block">{s.name}</span>
                                <span className="text-xs text-slate-500 font-mono">{s.rut}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-gold font-bold">
                            <Coins className="w-4 h-4" />{s.points.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function AnaliticasPanel() {
    return (
        <div>
            <p className="text-slate-400 mb-6">Métricas de rendimiento y participación de tus alumnos.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Total Alumnos', value: '60', color: 'text-accent-light' },
                    { label: 'Misiones Completadas', value: '147', color: 'text-primary-light' },
                    { label: 'Canjes Realizados', value: '23', color: 'text-gold' },
                ].map((s, i) => (
                    <div key={i} className="bg-surface-light border border-white/5 rounded-2xl p-6 text-center">
                        <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-slate-400 text-sm mt-1">{s.label}</p>
                    </div>
                ))}
            </div>
            <div className="bg-surface-light border border-white/5 rounded-2xl p-8 flex items-center justify-center min-h-[200px]">
                <div className="text-center text-slate-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="font-semibold">Gráficos de rendimiento</p>
                    <p className="text-sm">Se conectarán con los datos de Convex en producción.</p>
                </div>
            </div>
        </div>
    )
}
