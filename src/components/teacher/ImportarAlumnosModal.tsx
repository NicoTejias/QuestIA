import { useState, useRef } from 'react'
import { useMutation, useAction } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Upload, CheckCircle, X, Loader2, Cloud, FileSpreadsheet, Link2, Unlink, RefreshCw } from 'lucide-react'
import { useGooglePicker } from '../../hooks/useGooglePicker'
import Papa from 'papaparse'
import { toast } from "sonner"

interface ImportarAlumnosModalProps {
    course: any
    onClose: () => void
}

type UploadMode = 'add' | 'sync' | 'clear'

export default function ImportarAlumnosModal({ course, onClose }: ImportarAlumnosModalProps) {
    const uploadWhitelist = useMutation(api.courses.batchUploadWhitelist)
    const linkSheets = useMutation(api.courses.linkGoogleSheets)
    const unlinkSheets = useMutation(api.courses.unlinkGoogleSheets)
    const syncFromSheets = useAction(api.sheets_sync.syncCourseFromSheets)
    const fileRef = useRef<HTMLInputElement>(null)
    const [parsedData, setParsedData] = useState<{ id: string, name: string, section?: string }[]>([])
    const [fileName, setFileName] = useState('')
    const [uploading, setUploading] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [error, setError] = useState('')
    const { openPicker, downloadFile, isLoaded } = useGooglePicker()
    const [uploadMode, setUploadMode] = useState<UploadMode>('sync')

    const hasLinkedSheets = !!course.linked_sheets_id

    const findColumn = (headers: string[], keywords: string[]): number => {
        if (!headers) return -1
        for (const kw of keywords) {
            const idx = headers.findIndex(h => {
                if (!h || typeof h !== 'string') return false
                return h.toLowerCase().includes(kw.toLowerCase())
            })
            if (idx !== -1) return idx
        }
        return -1
    }

    const processFile = async (file: File) => {
        setFileName(file.name)
        setError('')
        setParsedData([])

        const ext = file.name.split('.').pop()?.toLowerCase()

        if (ext === 'xlsx' || ext === 'xls') {
            try {
                const XLSX = await import('xlsx')
                const arrayBuffer = await file.arrayBuffer()
                const workbook = XLSX.read(arrayBuffer, { type: 'array' })
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
                const jsonData = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 }) as string[][]

                if (jsonData.length < 2) {
                    setError('El archivo Excel está vacío o no tiene datos.')
                    return
                }

                let headerRowIdx = 0
                let detectedSection = ''

                for (let i = 0; i < Math.min(5, jsonData.length); i++) {
                    const row = (jsonData[i] || []).map(c => String(c || '').toLowerCase())
                    const fullRowText = (jsonData[i] || []).join(' ')
                    const sectionMatch = fullRowText.match(/([0-9]{3}[A-Z])/i)
                    if (sectionMatch && !detectedSection) {
                        detectedSection = sectionMatch[1].toUpperCase()
                    }
                    if (row.some(c => c.includes('rut') || c.includes('alumno') || c.includes('matrícula') || c.includes('matricula'))) {
                        headerRowIdx = i
                        break
                    }
                }

                const headers = (jsonData[headerRowIdx] || []).map(h => String(h || ''))
                const dataRows = jsonData.slice(headerRowIdx + 1)

                const rutCol = findColumn(headers, ['rut alumno', 'rut', 'matrícula', 'matricula', 'identificador', 'id alumno'])
                const nombresCol = findColumn(headers, ['nombres', 'nombre'])
                const apPaternoCol = findColumn(headers, ['apellido paterno', 'ap. paterno', 'paterno'])
                const apMaternoCol = findColumn(headers, ['apellido materno', 'ap. materno', 'materno'])
                const seccionCol = findColumn(headers, ['sección', 'seccion', 'grupo', 'curso'])

                if (rutCol === -1) {
                    const firstNumericCol = headers.findIndex((_, i) => {
                        const val = String(dataRows[0]?.[i] || '')
                        return /^\d{6,}/.test(val.replace(/\./g, ''))
                    })
                    if (firstNumericCol === -1) {
                        setError('No se encontró una columna de RUT en el archivo.')
                        return
                    }
                    const entries = dataRows
                        .map(row => {
                            const rawId = String(row[firstNumericCol] || '').trim()
                            const id = rawId.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
                            const section = seccionCol !== -1 ? String(row[seccionCol] || '').trim() : detectedSection || undefined
                            return { id, name: '', section }
                        })
                        .filter(e => e.id.length > 3)
                    setParsedData(entries)
                } else {
                    const entries = dataRows
                        .map(row => {
                            const rawRut = String(row[rutCol] || '').trim()
                            const rut = rawRut.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
                            const parts = []
                            if (nombresCol !== -1) parts.push(String(row[nombresCol] || '').trim())
                            if (apPaternoCol !== -1) parts.push(String(row[apPaternoCol] || '').trim())
                            if (apMaternoCol !== -1) parts.push(String(row[apMaternoCol] || '').trim())
                            const name = parts.filter(Boolean).join(' ')
                            const section = seccionCol !== -1 ? String(row[seccionCol] || '').trim() : detectedSection || undefined
                            return { id: rut, name, section }
                        })
                        .filter(e => e.id.length > 3)
                    setParsedData(entries)
                }
            } catch (err: any) {
                setError(`Error al leer el archivo Excel: ${err.message}`)
            }
        } else {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const headers = results.meta.fields || []
                    const rutCol = findColumn(headers, ['rut alumno', 'rut', 'matrícula', 'matricula', 'identificador'])
                    const nombresCol = findColumn(headers, ['nombres', 'nombre'])
                    const apPaternoCol = findColumn(headers, ['apellido paterno', 'paterno'])
                    const seccionCol = findColumn(headers, ['sección', 'seccion', 'grupo', 'curso'])

                    const entries = results.data
                        .map((row: any) => {
                            const values = Object.values(row) as string[]
                            const rawId = rutCol !== -1 ? String(values[rutCol] || '').trim() : String(values[0] || '').trim()
                            const id = rawId.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
                            const parts = []
                            if (nombresCol !== -1) parts.push(String(values[nombresCol] || '').trim())
                            if (apPaternoCol !== -1) parts.push(String(values[apPaternoCol] || '').trim())
                            const section = seccionCol !== -1 ? String(values[seccionCol] || '').trim() : undefined
                            return { id, name: parts.filter(Boolean).join(' '), section }
                        })
                        .filter(e => e.id.length > 3)
                    setParsedData(entries)
                },
                error: (err: any) => setError('Error al leer el archivo CSV: ' + err.message)
            })
        }
    }

    const handleUpload = async () => {
        if (parsedData.length === 0) return
        setUploading(true)
        setError('')
        try {
            const finalData = parsedData.map(e => ({
                identifier: e.id,
                name: e.name,
                section: e.section || undefined
            }))

            const result = await uploadWhitelist({
                course_id: course._id as any,
                students: finalData,
                clear_existing: uploadMode === 'clear',
                sync_mode: uploadMode === 'sync',
            })

            const parts = [`${result.added} nuevos`]
            if (result.updated > 0) parts.push(`${result.updated} actualizados`)
            if (result.removed > 0) parts.push(`${result.removed} eliminados`)
            toast.success(`Lista sincronizada: ${parts.join(', ')}`)
            onClose()
        } catch (err: any) {
            setError(err.message || 'Error al cargar la whitelist')
        } finally {
            setUploading(false)
        }
    }

    const handleSyncFromSheets = async () => {
        setSyncing(true)
        setError('')
        try {
            const result = await syncFromSheets({ course_id: course._id })
            const parts = [`${result.added} nuevos`]
            if (result.updated > 0) parts.push(`${result.updated} actualizados`)
            if (result.removed > 0) parts.push(`${result.removed} eliminados`)
            toast.success(`Sync desde Sheets: ${parts.join(', ')} (${result.total} total)`)
            onClose()
        } catch (err: any) {
            setError(err.message || 'Error sincronizando desde Google Sheets')
        } finally {
            setSyncing(false)
        }
    }

    const handleLinkSheets = () => {
        openPicker(async (files) => {
            const file = files[0]
            if (!file) return
            try {
                await linkSheets({
                    course_id: course._id as any,
                    sheets_id: file.id,
                    sheets_name: file.name,
                })
                toast.success(`Google Sheets "${file.name}" vinculado. Se sincronizará automáticamente cada día a las 7:00 AM.`)
            } catch (err: any) {
                toast.error(err.message || 'Error vinculando Sheets')
            }
        })
    }

    const handleUnlinkSheets = async () => {
        try {
            await unlinkSheets({ course_id: course._id as any })
            toast.success('Google Sheets desvinculado')
        } catch (err: any) {
            toast.error(err.message || 'Error desvinculando')
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-surface border border-white/10 rounded-[2rem] max-w-xl w-full p-8 animate-in zoom-in-95 duration-300 relative overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500"></div>

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
                            <FileSpreadsheet className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Importar Alumnos</h2>
                            <p className="text-sm text-slate-400">Sincroniza o importa tu listado</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 flex items-start gap-3 text-left">
                        <span className="text-red-400 text-lg shrink-0">!</span>
                        <p className="text-red-400 text-xs flex-1 leading-relaxed">{error}</p>
                        <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="space-y-6">
                    {/* ── Google Sheets Vinculado ── */}
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Google Sheets Vinculado</label>
                        {hasLinkedSheets ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Link2 className="w-5 h-5 text-emerald-400" />
                                        <div>
                                            <p className="text-white text-sm font-bold truncate max-w-[250px]">{course.linked_sheets_name}</p>
                                            <p className="text-slate-500 text-[10px]">
                                                {course.last_sheets_sync
                                                    ? `Sync: ${new Date(course.last_sheets_sync).toLocaleDateString('es-CL', { timeZone: 'America/Santiago', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                                                    : 'Sin sincronizar aún'}
                                                {' · Auto-sync diario 7:00 AM'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSyncFromSheets}
                                            disabled={syncing}
                                            className="p-2 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                            title="Sincronizar ahora"
                                        >
                                            {syncing
                                                ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                                                : <RefreshCw className="w-4 h-4 text-emerald-400" />}
                                        </button>
                                        <button
                                            onClick={handleUnlinkSheets}
                                            className="p-2 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors"
                                            title="Desvincular"
                                        >
                                            <Unlink className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleLinkSheets}
                                disabled={!isLoaded}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-500/10 text-emerald-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                            >
                                <Link2 className="w-4 h-4" /> Vincular Google Sheets para sync automático
                            </button>
                        )}
                    </div>

                    <div className="relative flex items-center gap-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">o importar archivo</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* ── Ramo de destino ── */}
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Ramo de Destino</label>
                        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold flex items-center justify-between">
                            <span className="truncate">{course.name}</span>
                            <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-400 font-mono ml-4 shrink-0">{course.code}</span>
                        </div>
                    </div>

                    {/* ── Archivo ── */}
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Archivo de Alumnos</label>
                        <div className="grid grid-cols-1 gap-4">
                            <label className="flex flex-col items-center justify-center w-full h-40 bg-surface-light border-2 border-dashed border-white/5 rounded-3xl cursor-pointer hover:border-green-500/30 hover:bg-green-500/5 transition-all group overflow-hidden">
                                <div className="flex gap-2 mb-3">
                                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Upload className="w-5 h-5 text-green-400" />
                                    </div>
                                </div>
                                <span className="text-white text-sm font-bold tracking-tight">{fileName || 'Seleccionar Archivo'}</span>
                                <span className="text-slate-500 text-[10px] mt-1 uppercase font-bold tracking-widest opacity-50">.xlsx, .xls o .csv</span>
                                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if(f) processFile(f);
                                }} />
                            </label>

                            <button
                                onClick={() => openPicker(async (files, token) => {
                                    setUploading(true);
                                    for (const file of files) {
                                        try {
                                            const blob = await downloadFile(file.id, token);
                                            const driveFile = new File([blob], file.name, { type: file.mimeType });
                                            await processFile(driveFile);
                                        } catch (err: any) { toast.error(`Error de Drive: ${err.message}`); }
                                    }
                                    setUploading(false);
                                })}
                                disabled={!isLoaded || uploading}
                                className="flex items-center justify-center gap-3 w-full py-4 bg-[#4285F4]/10 text-[#4285F4] rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] border border-[#4285F4]/20 hover:bg-[#4285F4]/20 transition-all disabled:opacity-50"
                            >
                                <Cloud className="w-4 h-4" /> Importar de Google Drive
                            </button>
                        </div>
                    </div>

                    {/* ── Modo de importación ── */}
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Modo de Importación</label>
                        <div className="grid grid-cols-3 gap-2">
                            {([
                                { mode: 'sync' as UploadMode, label: 'Sincronizar', desc: 'Agrega nuevos y elimina los que ya no están' },
                                { mode: 'add' as UploadMode, label: 'Solo Agregar', desc: 'Solo agrega nuevos, no elimina nada' },
                                { mode: 'clear' as UploadMode, label: 'Reemplazar', desc: 'Borra la lista anterior y crea todo de nuevo' },
                            ]).map(({ mode, label, desc }) => (
                                <button
                                    key={mode}
                                    onClick={() => setUploadMode(mode)}
                                    className={`p-3 rounded-2xl border text-left transition-all ${
                                        uploadMode === mode
                                            ? 'bg-green-500/10 border-green-500/30 text-white'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                    }`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest block">{label}</span>
                                    <span className="text-[9px] text-slate-500 mt-1 block leading-tight">{desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {parsedData.length > 0 && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <span className="text-white font-bold text-sm">{parsedData.length} alumnos detectados</span>
                            </div>
                            <button onClick={() => setParsedData([])} className="text-red-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors">Descartar</button>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button onClick={onClose} className="flex-1 py-4 bg-white/5 border border-white/10 text-slate-400 font-black text-[10px] uppercase tracking-[0.15em] rounded-2xl hover:bg-white/10 transition-all">Cancelar</button>
                        <button
                            disabled={uploading || parsedData.length === 0}
                            onClick={handleUpload}
                            className="flex-1 py-4 bg-green-500 text-white font-black text-[10px] uppercase tracking-[0.15em] rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Upload className="w-4 h-4" />}
                            {uploadMode === 'sync' ? 'Sincronizar' : uploadMode === 'clear' ? 'Reemplazar' : 'Agregar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
