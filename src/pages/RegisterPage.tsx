import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthActions } from "@convex-dev/auth/react"
import { Rocket, Mail, Lock, User, GraduationCap, BookOpen, Loader2, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
    const { signIn } = useAuthActions()
    const navigate = useNavigate()
    const [role, setRole] = useState<'student' | 'teacher' | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        student_id: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.')
            setLoading(false)
            return
        }

        const fd = new FormData()
        fd.append('email', formData.email)
        fd.append('password', formData.password)
        fd.append('name', formData.name)
        fd.append('role', role!)
        fd.append('student_id', formData.student_id)
        fd.append('flow', 'signUp')

        try {
            await signIn('password', fd)
            // Redirigir según el rol
            if (role === 'student') {
                navigate('/test-belbin')
            } else {
                navigate('/docente')
            }
        } catch (err: any) {
            const msg = err?.message || ''
            if (msg.includes('already exists') || msg.includes('existing')) {
                setError('Ya existe una cuenta con este correo. Intenta iniciar sesión.')
            } else {
                setError('Error al crear la cuenta. Intenta de nuevo.')
            }
        } finally {
            setLoading(false)
        }
    }

    // Paso 1: Seleccionar Rol
    if (!role) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-6">
                <div className="max-w-xl w-full">
                    <div className="flex items-center gap-3 mb-12 justify-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                            <Rocket className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">GestiónDocente</span>
                    </div>

                    <h1 className="text-3xl font-bold text-white text-center mb-3">Crea tu cuenta</h1>
                    <p className="text-slate-400 text-center mb-10 text-lg">¿Cuál es tu rol en la plataforma?</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <button
                            onClick={() => setRole('student')}
                            className="group bg-surface-light border-2 border-white/5 rounded-3xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 text-left"
                        >
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                <GraduationCap className="w-8 h-8 text-primary-light" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Soy Alumno</h3>
                            <p className="text-slate-400 text-sm">Accede a tus ramos, completa misiones y gana recompensas.</p>
                        </button>

                        <button
                            onClick={() => setRole('teacher')}
                            className="group bg-surface-light border-2 border-white/5 rounded-3xl p-8 hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:shadow-accent/10 text-left"
                        >
                            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                                <BookOpen className="w-8 h-8 text-accent-light" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Soy Docente</h3>
                            <p className="text-slate-400 text-sm">Gestiona ramos, crea misiones y monitorea a tus alumnos.</p>
                        </button>
                    </div>

                    <p className="text-center text-slate-500 mt-8 text-sm">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="text-primary-light hover:text-primary font-semibold transition-colors">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        )
    }

    // Paso 2: Formulario de Registro
    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                <button
                    onClick={() => setRole(null)}
                    className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1 transition-colors"
                >
                    ← Volver a selección de rol
                </button>

                <div className="flex items-center gap-3 mb-8">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === 'student' ? 'bg-primary/20' : 'bg-accent/20'}`}>
                        {role === 'student' ? <GraduationCap className="w-6 h-6 text-primary-light" /> : <BookOpen className="w-6 h-6 text-accent-light" />}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Registro como {role === 'student' ? 'Alumno' : 'Docente'}
                        </h1>
                        <p className="text-slate-400 text-sm">Completa tus datos para crear tu cuenta.</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Nombre Completo</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Juan Pérez González"
                                className="w-full bg-surface-light border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Correo Electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="tu@correo.com"
                                className="w-full bg-surface-light border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">
                            {role === 'student' ? 'RUT o Matrícula' : 'Número de Registro Docente'}
                        </label>
                        <input
                            type="text"
                            value={formData.student_id}
                            onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                            placeholder={role === 'student' ? '12.345.678-9' : 'REG-DOCENTE-001'}
                            className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Mínimo 8 caracteres"
                                className="w-full bg-surface-light border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                minLength={8}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-surface-light border border-white/5 rounded-xl p-4 flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary-light shrink-0 mt-0.5" />
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Al registrarte, tu{' '}
                            {role === 'student' ? 'RUT/Matrícula' : 'registro docente'} será
                            usado para la inscripción automática en los ramos que tu institución tenga configurados.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-white
              ${role === 'student'
                                ? 'bg-primary hover:bg-primary-light hover:shadow-lg hover:shadow-primary/25'
                                : 'bg-gradient-to-r from-accent to-primary hover:shadow-lg hover:shadow-accent/25'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </button>
                </form>

                <p className="text-center text-slate-500 mt-8 text-sm">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="text-primary-light hover:text-primary font-semibold transition-colors">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    )
}
