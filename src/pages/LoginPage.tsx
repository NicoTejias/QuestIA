import { useNavigate } from 'react-router-dom'
import { SignIn, useUser } from "@clerk/clerk-react"
import { Rocket } from 'lucide-react'
import { useEffect } from 'react'

export default function LoginPage() {
    const navigate = useNavigate()
    const { isSignedIn } = useUser()

    // Si ya estamos logueados y no hay errores, vamos al dashboard
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (isSignedIn && !params.get("error")) {
            navigate('/dashboard')
        }
    }, [isSignedIn, navigate])

    return (
        <div className="min-h-screen bg-surface flex pt-safe pb-safe">

            {/* Panel Izquierdo - Decorativo */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/20 to-surface items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-primary)_0%,_transparent_70%)] opacity-20" />
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

                <div className="relative z-10 text-center px-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30">
                        <Rocket className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Quest</h2>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Transforma tu clase en una experiencia gamificada donde aprender es la mejor aventura.
                    </p>
                </div>
            </div>

            {/* Panel Derecho - Clerk SignIn */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
                <div className="lg:hidden flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                        <Rocket className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">Quest</span>
                </div>

                <div className="clerk-auth-container">
                    <SignIn 
                        appearance={{
                            elements: {
                                card: "bg-surface-light border border-white/10 shadow-2xl rounded-3xl",
                                headerTitle: "text-white text-2xl font-bold",
                                headerSubtitle: "text-slate-400",
                                socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all",
                                socialButtonsBlockButtonText: "text-white font-semibold",
                                formButtonPrimary: "bg-primary hover:bg-primary-light text-white font-bold transition-all",
                                formFieldLabel: "text-slate-300 font-medium",
                                formFieldInput: "bg-surface border-white/10 text-white rounded-xl focus:border-primary",
                                footerActionText: "text-slate-400",
                                footerActionLink: "text-primary-light hover:text-primary font-bold",
                                dividerText: "text-slate-500",
                                dividerLine: "bg-white/5",
                                identityPreviewText: "text-white",
                                identityPreviewEditButtonIcon: "text-primary-light"
                            }
                        }}
                        signUpUrl="/registro"
                        forceRedirectUrl={window.location.origin + "/dashboard"}
                    />
                </div>

                <p className="mt-8 text-slate-500 text-xs text-center max-w-xs">
                    Inicia sesión con tu correo institucional para acceder a tus ramos y misiones.
                </p>
            </div>
        </div>
    )
}
