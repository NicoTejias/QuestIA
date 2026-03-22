import { useNavigate } from 'react-router-dom'
import { SignIn, useUser } from "@clerk/clerk-react"
import { useConvexAuth } from "convex/react"
import { useEffect } from 'react'
import { Sparkles } from 'lucide-react'

export default function LoginPage() {
    const navigate = useNavigate()
    const { isSignedIn } = useUser()
    const { isAuthenticated, isLoading } = useConvexAuth()

    useEffect(() => {
        if (isSignedIn && isAuthenticated && !isLoading) {
            navigate('/dashboard', { replace: true })
        }
    }, [isSignedIn, isAuthenticated, isLoading, navigate])

    return (
        <div className="min-h-screen bg-surface flex pt-safe pb-safe">

            {/* Panel Izquierdo - Decorativo */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/10 to-surface items-center justify-center border-r border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-primary)_0%,_transparent_70%)] opacity-10" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />

                <div className="relative z-10 text-center px-12">
                    <div className="mb-8 transform hover:scale-110 transition-transform duration-500 w-32 h-32 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-primary/20 border border-primary/20">
                        <Sparkles className="w-16 h-16 text-primary animate-pulse" />
                    </div>
                    <h2 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">
                        Quest<span className="text-primary">IA</span>
                    </h2>
                    <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-md mx-auto">
                        Potenciando tu aprendizaje con inteligencia artificial y la identidad de QuestIA.
                    </p>
                </div>
            </div>

            {/* Panel Derecho - Clerk SignIn */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-surface">
                <div className="lg:hidden flex flex-col items-center gap-4 mb-10">
                    <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <span className="text-3xl font-black text-white tracking-tighter uppercase italic">
                        Quest<span className="text-primary">IA</span>
                    </span>
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
