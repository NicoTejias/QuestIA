import { useState, useRef } from 'react'

import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { FileText, Upload, Trash2, Loader2, X, CheckCircle, Eye, EyeOff, BookOpen, Cloud, Sparkles } from 'lucide-react'
import { extractTextFromFile, getFileType, getFileIcon, formatFileSize } from '../../utils/documentParser'
import { useGooglePicker } from '../../hooks/useGooglePicker'

export default function MaterialPanel({ courses }: { courses: any[] }) {
    const generateUploadUrl = useMutation(api.documents.generateUploadUrl)
    const saveDocument = useMutation(api.documents.saveDocument)
    const deleteDocument = useMutation(api.documents.deleteDocument)
    const setAsMasterDoc = useMutation(api.documents.setAsMasterDoc)
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
    const [uploadType, setUploadType] = useState<string>('none')

    const ACCEPTED_TYPES = '.pdf,.docx,.pptx,.xlsx,.xls'
    const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

    const autoDetectType = (fileName: string, content: string): 'PDA' | 'PIA' | 'PA' | 'none' => {
        const text = (fileName + " " + content.substring(0, 3000)).toUpperCase();
        
        // Prioridad: Frases exactas
        if (text.includes("PLAN DIDÁCTICO DE AULA") || text.includes("PLAN DIDACTICO DE AULA")) return 'PDA';
        if (text.includes("PROGRAMA DE IMPLEMENTACIÓN DE ASIGNATURA") || text.includes("PROGRAMA DE IMPLEMENTACION DE ASIGNATURA")) return 'PIA';
        if (text.includes("PROGRAMA DE ASIGNATURA")) return 'PA';
        
        // Segundas opciones: Acrónimos (con cuidado)
        if (fileName.toUpperCase().includes("PDA")) return 'PDA';
        if (fileName.toUpperCase().includes("PIA")) return 'PIA';
        if (fileName.toUpperCase().includes("PA") && (text.includes("DUOC") || text.includes("UNIDAD"))) return 'PA';
        
        return 'none';
    }

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
        
        // Si el usuario dejó 'Material' (none), intentamos autodetectar.
        // Si el usuario seleccionó uno específicamente, respetamos su selección.
        let finalType = uploadType;
        if (uploadType === 'none') {
            finalType = autoDetectType(file.name, contentText);
        }

        await saveDocument({
            course_id: selectedCourse as any,
            file_id: storageId,
            file_name: file.name,
            file_type: fileType,
            file_size: file.size,
            content_text: contentText,
            is_master_doc: finalType !== 'none',
            master_doc_type: finalType !== 'none' ? finalType as any : undefined
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

    const handleSetMasterType = async (docId: any, type: string) => {
        try {
            await setAsMasterDoc({ document_id: docId, master_type: type as any })
            setSuccess(`Documento marcado como ${type === 'none' ? 'material común' : type}.`)
            setTimeout(() => setSuccess(''), 3000)
        } catch (err: any) {
            setError(err.message)
        }
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
        <div className="space-y-6 max-w-full overflow-x-hidden pb-10">
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">Sube documentos de tus ramos (PDF, DOCX, PPTX, XLSX). El sistema extraerá automáticamente el contenido para que la IA pueda generar actividades gamificadas.</p>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="md:col-span-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Tipo de Documento</label>
                        <div className="flex bg-surface border border-white/10 rounded-xl p-1 gap-1 overflow-x-auto no-scrollbar">
                            {[
                                { id: 'none', label: 'Material' },
                                { id: 'PDA', label: 'PDA' },
                                { id: 'PIA', label: 'PIA' },
                                { id: 'PA', label: 'PA' }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setUploadType(t.id)}
                                    className={`flex-1 py-2 px-2 text-[9px] font-black rounded-lg transition-all uppercase tracking-tight min-w-[60px]
                                        ${uploadType === t.id 
                                            ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
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
                        openPicker(async (files, token) => {
                            setUploading(true);
                            setError('');
                            setSuccess('');

                            for (const file of files) {
                                try {
                                    setUploadProgress(`📥 Descargando "${file.name}" de Drive...`);
                                    
                                    const blob = await downloadFile(file.id, token);
                                    let mimeType = file.mimeType;
                                    
                                    // Si era un Google Doc, lo exportamos como DOCX (así lo configuraste en el hook)
                                    if (mimeType.includes('google-apps')) {
                                        if (mimeType.includes('document')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                                        if (mimeType.includes('spreadsheet')) mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                                        if (mimeType.includes('presentation')) mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                                    }

                                    const driveFile = new File([blob], file.name, { type: mimeType });
                                    await processAndUploadFile(driveFile);
                                    
                                    setSuccess(prev => (prev ? prev + '\n' : '') + `✅ "${file.name}" importado.`);
                                } catch (err: any) {
                                    setError(prev => (prev ? prev + '\n' : '') + `Error con "${file.name}": ${err.message}`);
                                }
                            }
                            
                            setUploading(false);
                            setUploadProgress('');
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

            {/* Resumen de Bóveda Maestra (IA Context) */}
            {documents && documents.filter((d: any) => d.is_master_doc).length > 0 && (
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-6 shadow-xl shadow-primary/5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-black flex items-center gap-2 uppercase tracking-widest text-sm">
                            <Sparkles className="w-5 h-5 text-primary-light animate-pulse" />
                            Bóveda Maestra Consolidada
                        </h3>
                        <span className="bg-primary/20 text-primary-light px-3 py-1 rounded-full text-[10px] font-black border border-primary/20">
                            {documents.filter((d: any) => d.is_master_doc).length} DOCUMENTOS DE CONTEXTO IA
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {documents.filter((d: any) => d.is_master_doc).map((doc: any) => {
                            const course = courses.find((c: any) => c._id === doc.course_id);
                            return (
                                <div key={doc._id} className="relative group">
                                    <div className="absolute -top-2 left-4 z-10 bg-surface px-2 py-0.5 rounded-md border border-white/10 text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                                        {course?.name || 'Ramo Desconocido'}
                                    </div>
                                    <DocumentCard 
                                        doc={doc} 
                                        expandedDoc={expandedDoc}
                                        setExpandedDoc={setExpandedDoc}
                                        handleSetMasterType={handleSetMasterType}
                                        handleDelete={handleDelete}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className="h-px bg-white/5 flex-1"></div>
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Material por Ramo</span>
                <div className="h-px bg-white/5 flex-1"></div>
            </div>

            {/* Lista de documentos subidos (Solo material común) */}
            {Object.keys(docsByCourse).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(docsByCourse).map(([courseId, docs]) => {
                        const course = courses.find((c: any) => c._id === courseId)
                        const regularDocs = (docs as any[]).filter(d => !d.is_master_doc);
                        
                        if (regularDocs.length === 0) return null;

                        return (
                            <div key={courseId} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-accent-light" />
                                    {course?.name || 'Material sin clasificar'} <span className="text-slate-500 text-xs font-mono">{course?.code ? `(${course.code})` : ''}</span>
                                </h3>
                                <div className="space-y-2">
                                    {regularDocs.map((doc: any) => (
                                        <DocumentCard 
                                            key={doc._id} 
                                            doc={doc} 
                                            expandedDoc={expandedDoc}
                                            setExpandedDoc={setExpandedDoc}
                                            handleSetMasterType={handleSetMasterType}
                                            handleDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Sin material adicional</h4>
                    <p className="text-slate-400 text-sm">Sube documentos para complementar tus ramos.</p>
                </div>
            )}
        </div>
    )
}

    // --- Sub-componente interno para cada documento ---
    function DocumentCard({ doc, expandedDoc, setExpandedDoc, handleSetMasterType, handleDelete }: any) {
        return (
            <div className={`bg-surface-light border border-white/5 rounded-xl overflow-hidden transition-all ${doc.is_master_doc ? 'border-primary/20 shadow-lg shadow-primary/5' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-4 gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-2xl shrink-0">{getFileIcon(doc.file_type)}</span>
                        <div className="min-w-0">
                            <p className="text-white font-medium truncate text-sm">{doc.file_name}</p>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                                <span>{formatFileSize(doc.file_size)}</span>
                                <span>{doc.file_type.toUpperCase()}</span>
                                {doc.is_master_doc && (
                                    <span className="bg-primary/20 text-primary-light px-2 py-0.5 rounded-full font-black text-[8px] border border-primary/20">
                                        MASTER {doc.master_doc_type}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 shrink-0 border-t border-white/5 pt-3 sm:border-0 sm:pt-0">
                        <select
                            title="Tipo de Documento"
                            value={doc.master_doc_type || 'none'}
                            onChange={(e) => handleSetMasterType(doc._id, e.target.value)}
                            className="bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 text-[10px] font-black text-slate-400 focus:outline-none focus:border-primary/50 cursor-pointer"
                        >
                            <option value="none">Material</option>
                            <option value="PDA">PDA</option>
                            <option value="PIA">PIA</option>
                            <option value="PA">PA</option>
                        </select>
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
        )
    }
