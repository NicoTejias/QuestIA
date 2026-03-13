import { useNavigate } from 'react-router-dom'
import { SignUp, useUser } from "@clerk/clerk-react"
import { Rocket } from 'lucide-react'
import { useEffect } from 'react'

export default function RegisterPage() {
    const navigate = useNavigate()
    const { isSignedIn } = useUser()

    // Si ya estamos logueados y no hay errores en la URL, vamos al dashboard
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (isSignedIn && !params.get("error")) {
            navigate('/dashboard')
        }
    }, [isSignedIn, navigate])

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
            <div className="max-w-xl w-full flex flex-col items-center">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                        <Rocket className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white">GestiónDocente</span>
                </div>

                <div className="clerk-auth-container scale-95 sm:scale-100">
                    <SignUp 
                        appearance={{
                            elements: {
                                card: "bg-surface-light border border-white/10 shadow-2xl rounded-3xl",
                                headerTitle: "text-white text-2xl font-bold",
                                headerSubtitle: "text-slate-400",
                                socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all",
                                socialButtonsBlockButtonText: "text-white font-semibold",
                                formButtonPrimary: "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold transition-all",
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
                        signInUrl="/login"
                        forceRedirectUrl="/dashboard"
                    />
                </div>

                <p className="mt-8 text-slate-500 text-xs text-center max-w-xs">
                    Al registrarte, declaras ser parte de la comunidad académica seleccionada.
                </p>
            </div>
        </div>
    )
}
