import { useState } from 'react'
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { BookOpen, Plus, Loader2, ChevronRight, CheckCircle, Edit3, Trash2 } from 'lucide-react'
import CourseDetail from './CourseDetail'
import { toast } from 'sonner'
import ConfirmModal from '../ConfirmModal'
import { EditCourseModal } from './EditModals'

export default function RamosPanel({ courses, selectedCourse, setSelectedCourse }: { courses: any[], selectedCourse: any, setSelectedCourse: (c: any) => void }) {
    const createCourse = useMutation(api.courses.createCourse)
    const deleteCourse = useMutation(api.courses.deleteCourse)
    const [showCreate, setShowCreate] = useState(false)
    const [formData, setFormData] = useState({ name: '', code: '', description: '' })
    const [creating, setCreating] = useState(false)
    const [success, setSuccess] = useState('')

    // Edit and Delete state
    const [editingCourse, setEditingCourse] = useState<any>(null)
    const [courseToDelete, setCourseToDelete] = useState<any>(null)
    const [deleting, setDeleting] = useState(false)

    const handleCreate = async () => {
        if (!formData.name || !formData.code) return
        setCreating(true)
        try {
            await createCourse(formData)
            setSuccess(`Ramo "${formData.name}" creado exitosamente.`)
            setFormData({ name: '', code: '', description: '' })
            setShowCreate(false)
            setTimeout(() => setSuccess(''), 4000)
        } catch (err: any) {
            toast.error(err.message || 'Error al crear el ramo')
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async () => {
        if (!courseToDelete) return
        setDeleting(true)
        try {
            await deleteCourse({ course_id: courseToDelete._id })
            toast.success('Ramo eliminado correctamente')
            setCourseToDelete(null)
        } catch (err: any) {
            toast.error(err.message || 'Error al eliminar el ramo')
        } finally {
            setDeleting(false)
        }
    }

    if (selectedCourse) {
        return <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <p className="text-slate-400">Gestiona tus ramos activos.</p>
                <button onClick={() => setShowCreate(!showCreate)} className="bg-accent hover:bg-accent-light text-white font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4" />
                    Nuevo Ramo
                </button>
            </div>

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 text-sm font-medium">{success}</p>
                </div>
            )}

            {showCreate && (
                <div className="bg-surface-light border border-accent/20 rounded-2xl p-6 mb-6 space-y-4">
                    <h3 className="text-white font-bold">Crear Ramo</h3>
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre del ramo (ej. Electrotecnia I)" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent" />
                    <input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="Código (ej. ELT-101)" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent" />
                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción del ramo..." className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent h-24 resize-none" />
                    <button onClick={handleCreate} disabled={creating || !formData.name || !formData.code} className="bg-accent text-white font-bold px-6 py-3 rounded-xl hover:bg-accent-light transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                        {creating ? 'Creando...' : 'Crear Ramo'}
                    </button>
                </div>
            )}

            {courses.length === 0 && !showCreate ? (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Sin ramos aún</h4>
                    <p className="text-slate-400 text-sm">Crea tu primer ramo con el botón de arriba.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map((c: any) => (
                        <div key={c._id} className="bg-surface-light border border-white/5 rounded-2xl p-6 hover:border-accent/30 transition-all group relative cursor-pointer" onClick={() => setSelectedCourse(c)}>
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-white group-hover:text-accent-light transition-colors truncate pr-8">{c.name}</h3>
                                    <span className="text-xs text-slate-500 font-mono">{c.code}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingCourse(c) }}
                                        className="p-2 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                                        title="Editar Ramo"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCourseToDelete(c) }}
                                        className="p-2 text-slate-500 hover:text-red-400 bg-white/5 hover:bg-red-400/10 rounded-lg transition-all"
                                        title="Eliminar Ramo"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-accent-light ml-1" />
                                </div>
                            </div>
                            {c.description && <p className="text-slate-400 text-sm mt-3 line-clamp-2">{c.description}</p>}
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            <EditCourseModal
                isOpen={!!editingCourse}
                onClose={() => setEditingCourse(null)}
                data={editingCourse}
            />
            <ConfirmModal
                isOpen={!!courseToDelete}
                onClose={() => setCourseToDelete(null)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Eliminar Ramo"
                message={`¿Estás seguro de que quieres eliminar "${courseToDelete?.name}"? Se perderán todos los datos vinculados (alumnos, misiones, recompensas, quizzes). Esta acción es irreversible.`}
                confirmText="Sí, Eliminar Todo"
                variant="danger"
            />
        </div>
    )
}
