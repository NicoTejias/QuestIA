import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthActions } from "@convex-dev/auth/react"
import { Rocket, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const { signIn } = useAuthActions()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData()
        formData.append('email', email)
        formData.append('password', password)
        formData.append('flow', 'signIn')

        try {
            await signIn('password', formData)
            navigate('/alumno')
        } catch (err: any) {
            setError('Credenciales inválidas. Verifica tu correo y contraseña.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface flex">
            {/* Panel Izquierdo - Decorativo */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/20 to-surface items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-primary)_0%,_transparent_70%)] opacity-20" />
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

                <div className="relative z-10 text-center px-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30">
                        <Rocket className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-4">GestiónDocente</h2>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Transforma tu clase en una experiencia gamificada donde aprender es la mejor aventura.
                    </p>
                </div>
            </div>

            {/* Panel Derecho - Formulario */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">GestiónDocente</span>
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-2">Bienvenido de vuelta</h1>
                    <p className="text-slate-400 mb-8">Ingresa tus credenciales para acceder a tu cuenta.</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-2 block">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@correo.com"
                                    className="w-full bg-surface-light border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-2 block">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-surface-light border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <p className="text-center text-slate-400 mt-8">
                        ¿No tienes cuenta?{' '}
                        <Link to="/registro" className="text-primary-light hover:text-primary font-semibold transition-colors">
                            Regístrate aquí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
