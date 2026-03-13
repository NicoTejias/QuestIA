import { useState, useRef } from 'react'
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Upload, Trash2, CheckCircle, X, Loader2 } from 'lucide-react'
import Papa from 'papaparse'
import { formatRutWithDV } from '../../utils/rutUtils'

export default function WhitelistPanel({ courses }: { courses: any[] }) {
    const uploadWhitelist = useMutation(api.courses.batchUploadWhitelist)
    const fileRef = useRef<HTMLInputElement>(null)
    const [parsedData, setParsedData] = useState<{ id: string, name: string, section?: string }[]>([])
    const [fileName, setFileName] = useState('')
    const [selectedCourse, setSelectedCourse] = useState('')
    const [globalSection, setGlobalSection] = useState('')
    const [uploading, setUploading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    // Función inteligente para detectar columnas en el XLSX/CSV
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setFileName(file.name)
        setError('')
        setParsedData([])

        const ext = file.name.split('.').pop()?.toLowerCase()

        if (ext === 'xlsx' || ext === 'xls') {
            // ===== Parsear XLSX con SheetJS =====
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

                // Buscar la fila de headers (puede no ser la primera si tiene títulos)
                let headerRowIdx = 0
                let detectedSection = ''
                
                for (let i = 0; i < Math.min(5, jsonData.length); i++) {
                    const row = (jsonData[i] || []).map(c => String(c || '').toLowerCase())
                    
                    // Intentar extraer la sección del texto como "Histórico Asistencia Curso : GDP3475-004D | ..."
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

                if (detectedSection) {
                    setGlobalSection(detectedSection)
                }

                const headers = (jsonData[headerRowIdx] || []).map(h => String(h || ''))
                const dataRows = jsonData.slice(headerRowIdx + 1)

                // Detectar columna de RUT/identificador
                const rutCol = findColumn(headers, ['rut alumno', 'rut', 'matrícula', 'matricula', 'identificador', 'id alumno'])
                // Detectar columnas de nombre
                const nombresCol = findColumn(headers, ['nombres', 'nombre'])
                const apPaternoCol = findColumn(headers, ['apellido paterno', 'ap. paterno', 'paterno'])
                const apMaternoCol = findColumn(headers, ['apellido materno', 'ap. materno', 'materno'])
                // Detectar columna de sección
                const seccionCol = findColumn(headers, ['sección', 'seccion', 'grupo', 'curso'])

                if (rutCol === -1) {
                    // Fallback: usar la primera columna numérica como RUT
                    const firstNumericCol = headers.findIndex((_, i) => {
                        const val = String(dataRows[0]?.[i] || '')
                        return /^\d{6,}/.test(val.replace(/\./g, ''))
                    })
                    if (firstNumericCol === -1) {
                        setError('No se encontró una columna de RUT o identificador en el archivo. Asegúrate de que exista una columna "Rut Alumno".')
                        return
                    }
                    // Usar esa columna
                    const entries = dataRows
                        .map(row => {
                            const rawId = String(row[firstNumericCol] || '').trim()
                            const cleanBody = rawId.replace(/[^\dkK]/g, '')
                            // Si ya tiene guion o parece un RUT completo, no forzamos formatRutWithDV
                            let id = rawId;
                            if (!rawId.includes('-') && cleanBody.length >= 7 && cleanBody.length <= 8) {
                                id = formatRutWithDV(cleanBody);
                            } else {
                                id = rawId.toUpperCase().replace(/\./g, '');
                            }
                            const section = seccionCol !== -1 ? String(row[seccionCol] || '').trim() : detectedSection || undefined
                            return { id, name: '', section }
                        })
                        .filter(e => e.id.length > 3)
                    setParsedData(entries)
                } else {
                    const entries = dataRows
                        .map(row => {
                            const rawRut = String(row[rutCol] || '').trim()
                            const cleanBody = rawRut.replace(/[^\dkK]/g, '')
                            let rut = rawRut;
                            if (!rawRut.includes('-') && cleanBody.length >= 7 && cleanBody.length <= 8) {
                                rut = formatRutWithDV(cleanBody);
                            } else {
                                rut = rawRut.toUpperCase().replace(/\./g, '');
                            }

                            // Construir nombre completo
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
            // ===== Parsear CSV con PapaParse =====
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
                            const cleanBody = rawId.replace(/[^\dkK]/g, '')
                            let id = rawId;
                            if (!rawId.includes('-') && cleanBody.length >= 7 && cleanBody.length <= 8) {
                                id = formatRutWithDV(cleanBody);
                            } else {
                                id = rawId.toUpperCase().replace(/\./g, '');
                            }

                            const parts = []
                            if (nombresCol !== -1) parts.push(String(values[nombresCol] || '').trim())
                            if (apPaternoCol !== -1) parts.push(String(values[apPaternoCol] || '').trim())
                            const section = seccionCol !== -1 ? String(values[seccionCol] || '').trim() : undefined
                            return { id, name: parts.filter(Boolean).join(' '), section }
                        })
                        .filter(e => e.id.length > 3)
                    setParsedData(entries)
                },
                error: (err) => setError('Error al leer el archivo CSV: ' + err.message)
            })
        }
    }

    const handleUpload = async () => {
        if (!selectedCourse || parsedData.length === 0) return
        setUploading(true)
        setError('')
        try {
            const finalData = parsedData.map(e => ({
                identifier: e.id,
                name: e.name,
                section: e.section || globalSection || undefined
            }))

            const result = await uploadWhitelist({
                course_id: selectedCourse as any,
                students: finalData,
            })
            setSuccess(`✅ ${result.added} alumnos cargados exitosamente en la whitelist.`)
            setParsedData([])
            setFileName('')
            if (fileRef.current) fileRef.current.value = ''
            setTimeout(() => setSuccess(''), 5000)
        } catch (err: any) {
            setError(err.message || 'Error al cargar la whitelist')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="max-w-2xl">
            <p className="text-slate-400 mb-6">Sube el listado de alumnos en formato <strong className="text-white">XLSX</strong> o <strong className="text-white">CSV</strong>. El sistema detectará automáticamente la columna de RUT y los nombres.</p>

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 text-sm font-medium">{success}</p>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <span className="text-red-400 text-lg shrink-0">⚠️</span>
                    <p className="text-red-400 text-sm">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300" title="Cerrar error">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="bg-surface-light border border-white/5 rounded-2xl p-6 space-y-5">
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo</label>
                    <select
                        value={selectedCourse}
                        onChange={e => setSelectedCourse(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                        aria-label="Selecciona un ramo para la whitelist"
                        title="Seleccionar ramo"
                    >
                        <option value="">Selecciona un ramo</option>
                        {courses.map((c: any) => (
                            <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                        Sección General (Opcional)
                        <span className="text-xs text-slate-500 font-normal ml-2">Extraída del archivo automáticamente si es detectada</span>
                    </label>
                    <input
                        type="text"
                        value={globalSection}
                        onChange={e => setGlobalSection(e.target.value)}
                        placeholder="Ej. 004D, Sección 1..."
                        className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary placeholder:text-slate-600"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Archivo XLSX o CSV</label>
                    <label className="flex flex-col items-center justify-center w-full h-36 bg-surface border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-accent/40 transition-all group" title="Haz clic para subir el listado de alumnos">
                        <div className="flex gap-2 mb-2">
                            <span className="text-2xl">📗</span>
                            <span className="text-2xl">📄</span>
                        </div>
                        <span className="text-slate-400 text-sm font-medium">{fileName || 'Haz clic para subir el listado de alumnos'}</span>
                        <span className="text-slate-500 text-xs mt-1">.xlsx o .csv — se detectará el RUT y calculará el dígito verificador</span>
                        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} title="Subir archivo" />
                    </label>
                </div>

                {parsedData.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 text-green-400 mb-3">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold text-sm">{parsedData.length} alumnos detectados</span>
                        </div>
                        <div className="bg-surface rounded-xl overflow-hidden border border-white/5">
                            {/* Header de la tabla */}
                            <div className="flex items-center px-4 py-2.5 bg-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <span className="w-8 text-center">#</span>
                                <span className="w-32">RUT</span>
                                <span className="flex-1">Nombre</span>
                                <span className="w-32">Sección</span>
                                <span className="w-8"></span>
                            </div>
                            {/* Filas de alumnos */}
                            <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                                {parsedData.map((entry, i) => (
                                    <div key={i} className="flex items-center px-4 py-2.5 hover:bg-white/5 transition-colors">
                                        <span className="w-8 text-center text-slate-600 text-xs">{i + 1}</span>
                                        <span className="w-32 text-slate-300 font-mono text-sm">{entry.id}</span>
                                        <span className="flex-1 text-slate-400 text-sm truncate">{entry.name || '—'}</span>
                                        <span className="w-32 text-slate-500 text-xs truncate bg-black/20 px-2 py-1 rounded-md">{entry.section || globalSection || 'N/A'}</span>
                                        <button
                                            onClick={() => setParsedData(parsedData.filter((_, idx) => idx !== i))}
                                            className="w-8 flex justify-center text-slate-600 hover:text-red-400 transition-colors"
                                            title="Eliminar alumno de la lista"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={uploading || !selectedCourse}
                            className="mt-4 bg-accent hover:bg-accent-light text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Confirmar carga de whitelist"
                        >
                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            {uploading ? 'Cargando...' : `Cargar Whitelist (${parsedData.length} alumnos)`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
