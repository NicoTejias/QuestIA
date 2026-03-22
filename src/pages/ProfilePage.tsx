import { useState, useEffect } from 'react'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Camera, BadgeCheck, User, RefreshCw, Upload, Mail, Shield, Key, Save, Loader2, ArrowLeft, IdCard } from 'lucide-react'

export default function ProfilePage() {
    const user = useQuery(api.users.getProfile)
    const updateProfile = useMutation(api.users.updateProfile)
    const updateAvatar = useMutation(api.users.updateAvatar)
    const resetBartle = useMutation(api.users.resetBartleTest)
    const navigate = useNavigate()

    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [name, setName] = useState('')
    const [studentId, setStudentId] = useState('')
    const [initialPopulated, setInitialPopulated] = useState(false)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        if (user && !initialPopulated) {
            setName(user.name || '')
            setStudentId(user.student_id || '')
            setInitialPopulated(true)
        }
    }, [user, initialPopulated])

    if (user === undefined) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
                <Shield className="w-16 h-16 text-red-500 mb-4 opacity-50" />
                <h1 className="text-2xl font-black text-white mb-2">Acceso No Autorizado</h1>
                <p className="text-slate-400 mb-8 max-w-sm">No pudimos encontrar tu perfil de usuario. Por favor, intenta iniciar sesión de nuevo.</p>
                <button onClick={() => navigate('/')} className="bg-primary hover:bg-primary-light text-white font-black px-8 py-3 rounded-xl transition-all">
                    Volver al Inicio
                </button>
            </div>
        )
    }


    const handleSave = async () => {
        setSaving(true)
        try {
            await updateProfile({ name, student_id: studentId })
            toast.success('Perfil actualizado correctamente')
            setEditing(false)
        } catch (err: any) {
            toast.error(err.message || 'Error al actualizar perfil')
        } finally {
            setSaving(false)
        }
    }

    const handleResetPassword = () => {
        toast.info('Para cambiar tu contraseña, utiliza el flujo de recuperación en la página de inicio de sesión.', {
            duration: 5000,
        })
    }


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, selecciona una imagen válida.')
            return
        }

        setUploading(true)
        
        try {
            // Redimensionar imagen en el cliente para ahorrar espacio
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = async () => {
                    const canvas = document.createElement('canvas')
                    const MAX_SIZE = 150 // Tamaño pequeño como pidió el usuario
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width
                            width = MAX_SIZE
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height
                            height = MAX_SIZE
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, width, height)
                    
                    // Comprimir a JPEG calidad media
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
                    await updateAvatar({ avatarUrl: dataUrl })
                    toast.success('Avatar actualizado con éxito')
                    setUploading(false)
                }
            }
        } catch (err: any) {
            toast.error('Error al subir la imagen')
            setUploading(false)
        }
    }

    const setDefaultAvatar = async () => {
        setUploading(true)
        try {
            await updateAvatar({ avatarUrl: "" })
            toast.success('Avatar restablecido al valor por defecto')
        } catch (err) {
            toast.error('Error al cambiar avatar')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface text-white">
            {/* Header / Nav */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-10 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver
                </button>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-8 text-center sm:text-left">
                        <div className="relative group">
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-primary to-accent rounded-[2.5rem] flex items-center justify-center overflow-hidden shadow-2xl shadow-primary/20 shrink-0 border-4 border-white/5 relative"
                            >
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                        <User className="w-16 h-16 text-primary" />
                                    </div>
                                )}
                                
                                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all backdrop-blur-sm">
                                    <Camera className="w-8 h-8 text-white" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                                </label>
                            </motion.div>
                            
                            {uploading && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center z-10">
                                    <RefreshCw className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                <h1 className="text-3xl md:text-5xl font-black text-white truncate">{user.name}</h1>
                                {user.is_verified && <BadgeCheck className="w-6 h-6 md:w-8 md:h-8 text-primary-light shrink-0" />}
                            </div>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                <p className="text-slate-400 font-medium text-base md:text-lg">{user.email}</p>
                                <span className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-primary-light">
                                    {user.role === 'teacher' ? 'Docente' : 'Alumno'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Avatar Selection Section */}
                <div className="bg-surface-light border border-white/5 rounded-[2.5rem] p-6 mb-12">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 px-2">Selecciona tu Identidad</h3>
                    <div className="flex flex-wrap gap-6 justify-center sm:justify-start px-2">
                        {/* Option Default */}
                        <button 
                            onClick={setDefaultAvatar}
                            className={`group relative flex flex-col items-center gap-3 transition-all ${!user.avatarUrl ? 'scale-105' : 'opacity-60 hover:opacity-100'}`}
                        >
                            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl overflow-hidden border-4 transition-all shadow-lg bg-primary/10 flex items-center justify-center
                                ${!user.avatarUrl ? 'border-primary shadow-primary/20' : 'border-white/10 hover:border-primary/50'}`}>
                                <User className="w-10 h-10 text-primary" />
                                {!user.avatarUrl && (
                                    <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full shadow-md z-10">
                                        <BadgeCheck className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">IDENTIDAD (Global)</span>
                        </button>

                        {/* Option Custom Photo */}
                        <div className="flex flex-col items-center gap-3">
                            <label className={`group relative flex flex-col items-center cursor-pointer transition-all ${user.avatarUrl ? 'scale-105' : 'opacity-60 hover:opacity-100'}`}>
                                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl overflow-hidden border-4 transition-all shadow-lg bg-surface
                                    ${user.avatarUrl ? 'border-accent shadow-accent/20' : 'border-white/10 hover:border-accent/50 group-hover:bg-white/5'}`}>
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="Custom" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Upload className="w-6 h-6 text-slate-500 group-hover:text-accent-light transition-colors" />
                                        </div>
                                    )}
                                    {user.avatarUrl && (
                                        <div className="absolute top-2 right-2 bg-accent text-white p-1 rounded-full shadow-md z-10">
                                            <BadgeCheck className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
                                    {user.avatarUrl ? 'Personalizada' : 'Cambiar Foto'}
                                </span>
                            </label>
                        </div>
                    </div>
                    <p className="mt-6 text-[10px] text-slate-500 font-medium px-2 leading-relaxed italic">
                        * Consejo: Sube una imagen cuadrada para que se vea mejor en tu perfil y ranking.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar navigation */}
                    <div className="space-y-2">
                        <button className="w-full flex items-center gap-3 px-6 py-4 bg-primary/10 text-primary-light border border-primary/20 rounded-2xl font-bold transition-all text-left">
                            <User className="w-5 h-5" />
                            Datos Personales
                        </button>
                        {user.role === 'student' && (
                            <button 
                                onClick={async () => {
                                    if(window.confirm('¿Quieres borrar tu perfil actual de jugador y repetir el test?')) {
                                        await resetBartle();
                                        toast.success('Perfil de jugador reseteado');
                                        navigate('/alumno');
                                    }
                                }}
                                className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/5 text-slate-400 hover:text-white rounded-2xl font-bold transition-all text-left"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Repetir Test Bartle
                            </button>
                        )}
                        <button className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/5 text-slate-400 hover:text-white rounded-2xl font-bold transition-all text-left">
                            <Shield className="w-5 h-5" />
                            Seguridad
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Personal Data Card */}
                        <div className="bg-surface-light border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-xl">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black flex items-center gap-3">
                                    <IdCard className="w-6 h-6 text-primary" />
                                    Información de la Cuenta
                                </h2>
                                {!editing ? (
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="text-primary-light hover:text-white font-bold text-sm transition-colors"
                                    >
                                        Editar Datos
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setEditing(false)
                                            setName(user.name || '')
                                            setStudentId(user.student_id || '')
                                        }}
                                        className="text-slate-500 hover:text-white font-bold text-sm transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block" htmlFor="profile-name">Nombre Completo</label>
                                    <input
                                        id="profile-name"
                                        type="text"
                                        value={editing ? name : user.name || ''}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={!editing}
                                        className={`w-full bg-black/20 border rounded-2xl p-4 text-white outline-none transition-all font-bold ${editing ? 'border-primary/50 focus:border-primary shadow-lg shadow-primary/5' : 'border-white/5 opacity-70 cursor-not-allowed'}`}
                                    />
                                </div>

                                {user.role === 'student' && (
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block" htmlFor="profile-student-id">Matrícula / ID Alumno</label>
                                        <input
                                            id="profile-student-id"
                                            type="text"
                                            value={editing ? studentId : user.student_id || ''}
                                            onChange={(e) => setStudentId(e.target.value)}
                                            disabled={!editing}
                                            placeholder="Ingresa tu ID de alumno"
                                            className={`w-full bg-black/20 border rounded-2xl p-4 text-white outline-none transition-all font-bold ${editing ? 'border-primary/50 focus:border-primary shadow-lg shadow-primary/5' : 'border-white/5 opacity-70 cursor-not-allowed'}`}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block" htmlFor="profile-email">Correo Electrónico</label>
                                    <div className="relative">
                                        <input
                                            id="profile-email"
                                            type="email"
                                            value={user.email}
                                            disabled
                                            className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-slate-500 font-bold opacity-70 cursor-not-allowed"
                                        />
                                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
                                    </div>
                                    <p className="text-[10px] text-slate-600 mt-2 ml-1">El correo electrónico no puede ser modificado por seguridad.</p>
                                </div>

                                {editing && (
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full bg-gradient-to-r from-primary to-accent text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        GUARDAR CAMBIOS
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Security Card */}
                        <div className="bg-surface-light border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-xl">
                            <h2 className="text-xl font-black flex items-center gap-3 mb-8">
                                <Key className="w-6 h-6 text-accent" />
                                Seguridad
                            </h2>
                            <div className="bg-black/20 border border-white/5 rounded-2xl p-6 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-white">Contraseña</h3>
                                        <p className="text-slate-500 text-sm">Gestiona el acceso a tu cuenta</p>
                                    </div>
                                    <button
                                        onClick={handleResetPassword}
                                        className="bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-2 rounded-xl border border-white/10 transition-all text-sm"
                                    >
                                        Solicitar Reset
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 text-primary-light text-xs font-bold">
                                    <Shield className="w-4 h-4" />
                                    Protegido con encriptación de grado militar
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
