import { useState, useRef } from 'react'

import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { FileText, Upload, Trash2, Loader2, X, CheckCircle, Eye, EyeOff, BookOpen, Cloud } from 'lucide-react'
import { extractTextFromFile, getFileType, getFileIcon, formatFileSize } from '../../utils/documentParser'
import { useGooglePicker } from '../../hooks/useGooglePicker'

export default function MaterialPanel({ courses }: { courses: any[] }) {
    const generateUploadUrl = useMutation(api.documents.generateUploadUrl)
    const saveDocument = useMutation(api.documents.saveDocument)
    const deleteDocument = useMutation(api.documents.deleteDocument)
    const documents = useQuery(api.documents.getMyDocuments)
    const fileRef = useRef<HTMLInputElement>(null)
    const { openPicker, downloadFile, isLoaded } = useGooglePicker()

    const [selectedCourse, setSelectedCourse] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [expandedDoc, setExpandedDoc] = useState<string | null>(null)
    const [dragOver, setDragOver] = useState(false)

    const ACCEPTED_TYPES = '.pdf,.docx,.pptx,.xlsx,.xls'
    const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

    const processAndUploadFile = async (file: File) => {
        const fileType = getFileType(file.name)
        if (!fileType) {
            throw new Error(`Archivo no soportado: ${file.name}. Usa PDF, DOCX, PPTX o XLSX.`)
        }

        if (file.size > MAX_FILE_SIZE && file.size > 0) { // Google Drive native docs might have size 0 before export
            throw new Error(`El archivo "${file.name}" excede el límite de 20MB.`)
        }

        // Paso 1: Extraer texto del documento
        setUploadProgress(`📖 Leyendo "${file.name}"...`)
        const contentText = await extractTextFromFile(file)

        // Paso 2: Subir archivo a Convex Storage
        setUploadProgress(`📤 Subiendo "${file.name}"...`)
        const uploadUrl = await generateUploadUrl()
        const result = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': file.type || 'application/octet-stream' },
            body: file,
        })
        const responseJson = await result.json()
        const storageId = responseJson.storageId

        // Paso 3: Guardar metadata + contenido en la BD
        setUploadProgress(`💾 Guardando "${file.name}"...`)
        await saveDocument({
            course_id: selectedCourse as any,
            file_id: storageId,
            file_name: file.name,
            file_type: fileType,
            file_size: file.size,
            content_text: contentText,
        })

        return contentText.length
    }

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        if (!selectedCourse) {
            setError('Selecciona un ramo antes de subir archivos.')
            // Limpiar el input para que se pueda volver a seleccionar archivos
            if (fileRef.current) fileRef.current.value = ''
            return
        }

        setError('')
        setSuccess('')

        for (const file of Array.from(files)) {
            setUploading(true)
            try {
                const charCount = await processAndUploadFile(file)
                setSuccess(`✅ "${file.name}" subido y procesado exitosamente. (${charCount.toLocaleString()} caracteres extraídos)`)
            } catch (err: any) {
                setError(`Error con "${file.name}": ${err.message}`)
            }
        }

        setUploading(false)
        setUploadProgress('')
        if (fileRef.current) fileRef.current.value = ''
    }

    const handleDelete = async (docId: any) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este documento?')) return
        try {
            await deleteDocument({ document_id: docId })
            setSuccess('Documento eliminado.')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        handleUpload(e.dataTransfer.files)
    }

    // Agrupar documentos por curso
    const docsByCourse = (documents || []).reduce((acc: Record<string, any[]>, doc: any) => {
        const cid = doc.course_id
        if (!acc[cid]) acc[cid] = []
        acc[cid].push(doc)
        return acc
    }, {})

    return (
        <div className="space-y-6">
            <p className="text-slate-400">Sube documentos de tus ramos (PDF, DOCX, PPTX, XLSX). El sistema extraerá automáticamente el contenido para que la IA pueda generar actividades gamificadas.</p>

            {/* Mensajes de estado */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-red-400 text-lg shrink-0">⚠️</span>
                    <p className="text-red-400 text-sm">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300" title="Cerrar error">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                    <p className="text-green-400 text-sm">{success}</p>
                </div>
            )}

            {/* Zona de Upload */}
            <div className="bg-surface-light border border-white/5 rounded-2xl p-6 space-y-5">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Upload className="w-5 h-5 text-accent-light" />
                    Subir Material
                </h3>

                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo destino</label>
                    <select
                        value={selectedCourse}
                        onChange={e => setSelectedCourse(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
                        aria-label="Selecciona un ramo para subir material"
                        title="Seleccionar ramo"
                    >
                        <option value="">Selecciona un ramo</option>
                        {courses.map((c: any) => (
                            <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                        ))}
                    </select>
                </div>

                {/* Drag & Drop Zone */}
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileRef.current?.click()}
                    className={`flex flex-col items-center justify-center w-full min-h-[180px] border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
            ${dragOver
                            ? 'border-accent bg-accent/10 scale-[1.02]'
                            : 'border-white/10 bg-surface hover:border-accent/40 hover:bg-surface-lighter'
                        } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
                    title="Arrastra archivos aquí o haz clic para seleccionar"
                >
                    {uploading ? (
                        <div className="text-center">
                            <Loader2 className="w-10 h-10 text-accent-light mx-auto mb-3 animate-spin" />
                            <p className="text-accent-light font-medium text-sm">{uploadProgress}</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex gap-3 mb-4">
                                <span className="text-3xl">📕</span>
                                <span className="text-3xl">📘</span>
                                <span className="text-3xl">📙</span>
                                <span className="text-3xl">📗</span>
                            </div>
                            <p className="text-white font-medium mb-1">Arrastra archivos aquí o haz clic para seleccionar</p>
                            <p className="text-slate-500 text-sm">PDF, DOCX, PPTX, XLSX — Máximo 20MB</p>
                        </>
                    )}
                    <input
                        ref={fileRef}
                        type="file"
                        accept={ACCEPTED_TYPES}
                        multiple
                        className="hidden"
                        onChange={e => handleUpload(e.target.files)}
                        title="Subir archivos"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-px bg-white/5 flex-1"></div>
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">o bien</span>
                    <div className="h-px bg-white/5 flex-1"></div>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!selectedCourse) {
                            setError('Selecciona un ramo antes de importar de Drive.');
                            return;
                        }
                        openPicker(async (file, token) => {
                            try {
                                setUploading(true);
                                setUploadProgress(`📥 Descargando "${file.name}" desde Drive...`);
                                
                                const blob = await downloadFile(file.id, token);
                                const driveFile = new File([blob], file.name, { type: file.mimeType });
                                await processAndUploadFile(driveFile);
                                
                                setSuccess(`✅ "${file.name}" importado exitosamente desde Google Drive.`);
                            } catch (err: any) {
                                setError(`Error al importar de Drive: ${err.message}`);
                            } finally {
                                setUploading(false);
                                setUploadProgress('');
                            }
                        });
                    }}
                    disabled={!isLoaded || uploading}
                    className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold transition-all border
                        ${!selectedCourse 
                            ? 'bg-white/5 text-white/20 border-white/5 cursor-not-allowed' 
                            : 'bg-[#4285F4]/10 text-[#4285F4] hover:bg-[#4285F4]/20 border-[#4285F4]/30'}
                    `}
                >
                    {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Cloud className="w-5 h-5" />
                    )}
                    Importar desde Google Drive
                </button>
            </div>

            {/* Lista de documentos subidos */}
            {Object.keys(docsByCourse).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(docsByCourse).map(([courseId, docs]) => {
                        const course = courses.find((c: any) => c._id === courseId)
                        return (
                            <div key={courseId}>
                                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-accent-light" />
                                    {course?.name || 'Ramo'} <span className="text-slate-500 text-xs font-mono">({course?.code})</span>
                                </h3>
                                <div className="space-y-2">
                                    {(docs as any[]).map((doc: any) => (
                                        <div key={doc._id} className="bg-surface-light border border-white/5 rounded-xl overflow-hidden">
                                            <div className="flex items-center justify-between px-5 py-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-2xl shrink-0">{getFileIcon(doc.file_type)}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-white font-medium truncate">{doc.file_name}</p>
                                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                                            <span>{formatFileSize(doc.file_size)}</span>
                                                            <span>{doc.file_type.toUpperCase()}</span>
                                                            <span>{doc.content_text.length.toLocaleString()} chars</span>
                                                            <span>{new Date(doc.uploaded_at).toLocaleDateString('es-CL')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={() => setExpandedDoc(expandedDoc === doc._id ? null : doc._id)}
                                                        className="p-2 text-slate-500 hover:text-accent-light hover:bg-accent/10 rounded-lg transition-colors"
                                                        title="Ver contenido extraído"
                                                    >
                                                        {expandedDoc === doc._id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(doc._id)}
                                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                        title="Eliminar documento"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            {expandedDoc === doc._id && (
                                                <div className="px-5 pb-4 border-t border-white/5">
                                                    <div className="mt-3 bg-surface rounded-xl p-4 max-h-64 overflow-y-auto">
                                                        <pre className="text-slate-300 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                                                            {doc.content_text.substring(0, 5000)}
                                                            {doc.content_text.length > 5000 && (
                                                                <span className="text-slate-500">{'\n\n'}... [{(doc.content_text.length - 5000).toLocaleString()} caracteres más]</span>
                                                            )}
                                                        </pre>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-2">
                                                        ✨ Este contenido será usado por la IA para generar quizzes, misiones y evaluaciones automáticas.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Sin material aún</h4>
                    <p className="text-slate-400 text-sm">Sube documentos PDF, DOCX, PPTX o XLSX para que la IA los analice y genere actividades gamificadas.</p>
                </div>
            )}
        </div>
    )
}
