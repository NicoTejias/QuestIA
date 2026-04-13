import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { ProfilesAPI } from '../lib/api'
import { Shield, FileText, Check, ChevronRight, ArrowLeft, Sparkles, Eye, Database, Lock, UserCheck, Trash2, Ban, AlertTriangle, Scale } from 'lucide-react'

type DocView = null | 'terms' | 'privacy'

function PrivacyContent() {
    return (
        <div className="space-y-7 text-sm">
            <div>
                <p className="text-slate-400 leading-relaxed">
                    En QuestIA tratamos tus datos con respeto y transparencia, de acuerdo con la{' '}
                    <strong className="text-slate-300">Ley N° 19.628</strong> sobre Protección de la Vida Privada de Chile.
                </p>
                <p className="text-slate-600 text-xs mt-2">Última actualización: 4 de abril de 2026</p>
            </div>

            {[
                {
                    icon: <Eye className="w-4 h-4" />,
                    title: '¿Qué información recopilamos?',
                    content: (
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                            <li><strong className="text-slate-300">Datos de cuenta:</strong> nombre, correo e imagen de perfil.</li>
                            <li><strong className="text-slate-300">Identificación académica:</strong> RUT o matrícula (voluntario).</li>
                            <li><strong className="text-slate-300">Actividad:</strong> puntajes, historial de quizzes, recompensas.</li>
                            <li><strong className="text-slate-300">Perfiles de aprendizaje:</strong> tests Belbin y Bartle (para formar grupos).</li>
                            <li><strong className="text-slate-300">Asistencia:</strong> ubicación aproximada solo cuando el docente activa geolocalización.</li>
                            <li><strong className="text-slate-300">Técnicos:</strong> token de notificaciones push, IP y metadatos de sesión.</li>
                        </ul>
                    )
                },
                {
                    icon: <Database className="w-4 h-4" />,
                    title: '¿Cómo usamos tus datos?',
                    content: (
                        <>
                            <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                                <li>Prestar el servicio de gamificación educativa.</li>
                                <li>Vincular tu cuenta a los ramos en que estás inscrito.</li>
                                <li>Enviar notificaciones relacionadas con tu curso.</li>
                                <li>Generar estadísticas de rendimiento para el docente.</li>
                                <li>Mejorar la plataforma con análisis agregados y anónimos.</li>
                            </ul>
                            <p className="text-amber-400/80 text-xs mt-3">
                                ⚠️ <strong>No vendemos, arrendamos ni cedemos tus datos a terceros</strong> con fines comerciales.
                            </p>
                        </>
                    )
                },
                {
                    icon: <Lock className="w-4 h-4" />,
                    title: 'Seguridad',
                    content: (
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                            <li>Autenticación con soporte para doble factor (Clerk).</li>
                            <li>Base de datos cifrada en tránsito y en reposo (Supabase).</li>
                            <li>Control de acceso por roles: solo accedes a tus propios datos.</li>
                            <li>Sin contraseñas almacenadas: usamos proveedores externos (Google, etc.).</li>
                        </ul>
                    )
                },
                {
                    icon: <UserCheck className="w-4 h-4" />,
                    title: 'Tus derechos (ARCO)',
                    content: (
                        <>
                            <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                                <li><strong className="text-slate-300">Acceso:</strong> solicitar copia de tus datos.</li>
                                <li><strong className="text-slate-300">Rectificación:</strong> corregir datos inexactos.</li>
                                <li><strong className="text-slate-300">Cancelación:</strong> eliminar tu cuenta y datos.</li>
                                <li><strong className="text-slate-300">Oposición:</strong> oponerte a determinados tratamientos.</li>
                            </ul>
                            <p className="text-slate-400 mt-3">Escríbenos a <strong className="text-primary-light">privacidad@questia.cl</strong></p>
                        </>
                    )
                },
                {
                    icon: <Trash2 className="w-4 h-4" />,
                    title: 'Retención y eliminación',
                    content: (
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                            <li>Datos conservados mientras la cuenta esté activa.</li>
                            <li>Cuentas de prueba eliminadas a los <strong className="text-slate-300">30 días</strong> de inactividad.</li>
                            <li>Eliminación efectiva en máximo <strong className="text-slate-300">30 días hábiles</strong> tras solicitarla.</li>
                        </ul>
                    )
                },
            ].map((s, i) => (
                <div key={i}>
                    <div className="flex items-center gap-2 mb-2 text-primary-light font-semibold">
                        {s.icon} {s.title}
                    </div>
                    {s.content}
                </div>
            ))}
        </div>
    )
}

function TermsContent() {
    return (
        <div className="space-y-7 text-sm">
            <div>
                <p className="text-slate-400 leading-relaxed">
                    Al usar QuestIA aceptas estos términos. Por favor léelos con atención. Si no estás de acuerdo, no utilices la plataforma.
                </p>
                <p className="text-slate-600 text-xs mt-2">Última actualización: 4 de abril de 2026 · Aplicable en Chile</p>
            </div>

            {[
                {
                    icon: <FileText className="w-4 h-4" />,
                    title: '1. Descripción del servicio',
                    content: (
                        <p className="text-slate-400 leading-relaxed">
                            QuestIA es una plataforma educativa de gamificación para instituciones de educación superior en Chile.
                            Permite crear cursos, desafíos y sistemas de recompensas, con funcionalidades de IA para generar contenido
                            educativo a partir del material del docente.
                        </p>
                    )
                },
                {
                    icon: <UserCheck className="w-4 h-4" />,
                    title: '2. Registro y elegibilidad',
                    content: (
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                            <li>Debes tener al menos <strong className="text-slate-300">16 años</strong> para usar QuestIA.</li>
                            <li>El acceso completo requiere correo institucional válido.</li>
                            <li>Eres responsable de la confidencialidad de tu cuenta.</li>
                            <li>No puedes crear cuentas en nombre de otra persona sin su consentimiento.</li>
                        </ul>
                    )
                },
                {
                    icon: <Shield className="w-4 h-4" />,
                    title: '3. Propiedad intelectual',
                    content: (
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                            <li>Los documentos que subas son de tu propiedad. Nos otorgas licencia limitada para procesarlos.</li>
                            <li>La plataforma, su diseño y código son propiedad exclusiva de QuestIA SpA.</li>
                            <li>Queda prohibida la reproducción sin autorización escrita.</li>
                        </ul>
                    )
                },
                {
                    icon: <Ban className="w-4 h-4" />,
                    title: '4. Conducta prohibida',
                    content: (
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                            <li>Hacer trampa o manipular puntajes del sistema.</li>
                            <li>Subir contenido ilegal, violento o discriminatorio.</li>
                            <li>Acceder a cuentas de otros usuarios sin autorización.</li>
                            <li>Usar bots o scripts para automatizar el uso sin permiso.</li>
                            <li>Compartir credenciales con terceros.</li>
                        </ul>
                    )
                },
                {
                    icon: <AlertTriangle className="w-4 h-4" />,
                    title: '5. Limitación de responsabilidad',
                    content: (
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                            <li>El servicio se provee "tal como está", sin garantía de disponibilidad ininterrumpida.</li>
                            <li>El contenido generado por IA es orientativo y no reemplaza el juicio del docente.</li>
                            <li>Los puntajes y recompensas virtuales no tienen valor monetario.</li>
                        </ul>
                    )
                },
                {
                    icon: <Scale className="w-4 h-4" />,
                    title: '6. Ley aplicable',
                    content: (
                        <p className="text-slate-400 leading-relaxed">
                            Estos términos se rigen por la <strong className="text-slate-300">ley chilena</strong>. Las disputas se
                            resolverán preferentemente por mediación y, en caso de no acuerdo, ante los
                            <strong className="text-slate-300"> tribunales ordinarios de Santiago</strong>.
                        </p>
                    )
                },
            ].map((s, i) => (
                <div key={i}>
                    <div className="flex items-center gap-2 mb-2 text-primary-light font-semibold">
                        {s.icon} {s.title}
                    </div>
                    {s.content}
                </div>
            ))}
        </div>
    )
}

export default function ConsentModal() {
    const { user: clerkUser } = useUser()
    const [checked, setChecked] = useState(false)
    const [loading, setLoading] = useState(false)
    const [viewing, setViewing] = useState<DocView>(null)

    const handleAccept = async () => {
        if (!checked || loading || !clerkUser) return
        setLoading(true)
        try {
            await ProfilesAPI.acceptTerms(clerkUser.id)
            window.location.reload()
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-surface flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_50%)] opacity-10 pointer-events-none" />

            <div className="relative w-full max-w-lg bg-surface-light border border-white/10 rounded-3xl shadow-2xl shadow-black/50 flex flex-col max-h-[90vh]">

                {viewing ? (
                    <>
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 shrink-0">
                            <button
                                onClick={() => setViewing(null)}
                                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                            >
                                <ArrowLeft className="w-4 h-4" /> Volver
                            </button>
                            <span className="text-white font-bold text-sm ml-2">
                                {viewing === 'terms' ? 'Términos y Condiciones' : 'Política de Privacidad'}
                            </span>
                        </div>

                        <div className="overflow-y-auto flex-1 px-6 py-5">
                            {viewing === 'terms' ? <TermsContent /> : <PrivacyContent />}
                        </div>

                        <div className="px-6 py-4 border-t border-white/5 shrink-0">
                            <button
                                onClick={() => setViewing(null)}
                                className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary-light font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" /> Entendido, volver al formulario
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-gradient-to-br from-primary/20 to-transparent border-b border-white/5 px-8 pt-8 pb-6 shrink-0 rounded-t-3xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-11 h-11 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                                <span className="text-2xl font-black text-white tracking-tighter italic">
                                    Quest<span className="text-primary">IA</span>
                                </span>
                            </div>
                            <h1 className="text-xl font-bold text-white">Bienvenido/a a QuestIA</h1>
                            <p className="text-slate-400 text-sm mt-1">
                                Antes de continuar, necesitamos tu consentimiento sobre cómo usamos tus datos.
                            </p>
                        </div>

                        <div className="px-8 py-6 space-y-4 overflow-y-auto flex-1">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-primary-light shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-white text-sm font-semibold">¿Qué datos recopilamos?</p>
                                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                                            Nombre, correo, RUT (opcional), actividad y perfiles de aprendizaje.{' '}
                                            <strong className="text-slate-300">No vendemos tus datos.</strong>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-accent-light shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-white text-sm font-semibold">¿Para qué los usamos?</p>
                                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                                            Solo para prestarte el servicio educativo: ramos, puntajes y notificaciones de curso.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setViewing('terms')}
                                    className="flex items-center justify-between gap-2 p-3.5 rounded-xl border border-white/10 hover:border-primary/30 hover:bg-white/5 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary-light shrink-0" />
                                        <span className="text-slate-300 text-xs font-semibold leading-tight">Términos y Condiciones</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary-light transition-colors shrink-0" />
                                </button>
                                <button
                                    onClick={() => setViewing('privacy')}
                                    className="flex items-center justify-between gap-2 p-3.5 rounded-xl border border-white/10 hover:border-primary/30 hover:bg-white/5 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-accent-light shrink-0" />
                                        <span className="text-slate-300 text-xs font-semibold leading-tight">Política de Privacidad</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary-light transition-colors shrink-0" />
                                </button>
                            </div>

                            <button
                                onClick={() => setChecked(c => !c)}
                                className="w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left hover:bg-white/5 active:scale-[0.99] border-white/10 hover:border-primary/30"
                            >
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                    checked ? 'bg-primary border-primary' : 'bg-transparent border-white/20'
                                }`}>
                                    {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                </div>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    He leído y acepto los{' '}
                                    <span className="text-white font-semibold">Términos y Condiciones</span>
                                    {' '}y la{' '}
                                    <span className="text-white font-semibold">Política de Privacidad</span>
                                    {' '}de QuestIA. Autorizo el tratamiento de mis datos conforme a la Ley N° 19.628.
                                </p>
                            </button>
                        </div>

                        <div className="px-8 pb-8 shrink-0">
                            <button
                                onClick={handleAccept}
                                disabled={!checked || loading}
                                className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary
                                    text-white font-bold py-4 rounded-2xl transition-all
                                    disabled:opacity-40 disabled:cursor-not-allowed
                                    enabled:hover:shadow-xl enabled:hover:shadow-primary/25
                                    enabled:active:scale-[0.98]
                                    flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span className="animate-pulse">Guardando...</span>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Acepto y quiero continuar
                                    </>
                                )}
                            </button>
                            <p className="text-center text-slate-600 text-xs mt-3">
                                Puedes revocar en cualquier momento escribiendo a privacidad@questia.cl
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}