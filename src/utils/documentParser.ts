/**
 * Utilidad para extraer texto de documentos PDF, DOCX, PPTX, XLSX
 * Se ejecuta en el navegador (client-side parsing)
 */

// Worker de PDF.js - Vite lo sirve como asset estático
import PdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// ===== PDF =====
async function parsePDF(file: File): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist')

    // Usar el worker local servido por Vite
    pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorkerUrl

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const textParts: string[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items
            .map((item: any) => item.str)
            .join(' ')

        if (pageText.trim()) {
            textParts.push(`--- Página ${i} ---\n${pageText}`)
        }
    }

    return textParts.join('\n\n')
}

// ===== DOCX =====
async function parseDOCX(file: File): Promise<string> {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
}

// ===== PPTX =====
async function parsePPTX(file: File): Promise<string> {
    // PPTX es un ZIP con archivos XML dentro
    // Parseamos manualmente usando la API nativa del navegador
    const arrayBuffer = await file.arrayBuffer()

    try {
        const blob = new Blob([arrayBuffer])
        const zip = await loadZip(blob)

        const textParts: string[] = []
        let slideNum = 1

        // Los slides están en ppt/slides/slide1.xml, slide2.xml, etc.
        for (const [path, content] of zip.entries()) {
            if (path.match(/ppt\/slides\/slide\d+\.xml$/)) {
                // Extraer texto de los nodos XML
                const text = extractTextFromXML(content)
                if (text.trim()) {
                    textParts.push(`--- Diapositiva ${slideNum} ---\n${text}`)
                }
                slideNum++
            }
        }

        return textParts.join('\n\n') || '[No se pudo extraer texto de este archivo PPTX]'
    } catch {
        // Fallback: intentar parsearlo como un archivo genérico
        return '[No se pudo parsear el archivo PPTX. Intente convertirlo a PDF primero.]'
    }
}

// ===== XLSX =====
async function parseXLSX(file: File): Promise<string> {
    const XLSX = await import('xlsx')
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    const textParts: string[] = []

    workbook.SheetNames.forEach((sheetName: string) => {
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_csv(sheet)
        if (data.trim()) {
            textParts.push(`--- Hoja: ${sheetName} ---\n${data}`)
        }
    })

    return textParts.join('\n\n')
}

// ===== Helpers =====
async function loadZip(blob: Blob): Promise<Map<string, string>> {
    // Usar la API de DecompressionStream cuando esté disponible,
    // o parsear el ZIP manualmente con structuras básicas
    const arrayBuffer = await blob.arrayBuffer()
    const uint8 = new Uint8Array(arrayBuffer)

    const entries = new Map<string, string>()

    // Buscar el End of Central Directory
    let eocdOffset = -1
    for (let i = uint8.length - 22; i >= 0; i--) {
        if (uint8[i] === 0x50 && uint8[i + 1] === 0x4b && uint8[i + 2] === 0x05 && uint8[i + 3] === 0x06) {
            eocdOffset = i
            break
        }
    }

    if (eocdOffset === -1) return entries

    const cdOffset = uint8[eocdOffset + 16] | (uint8[eocdOffset + 17] << 8) | (uint8[eocdOffset + 18] << 16) | (uint8[eocdOffset + 19] << 24)
    const cdSize = uint8[eocdOffset + 12] | (uint8[eocdOffset + 13] << 8) | (uint8[eocdOffset + 14] << 16) | (uint8[eocdOffset + 15] << 24)

    let offset = cdOffset
    const cdEnd = cdOffset + cdSize

    while (offset < cdEnd) {
        if (uint8[offset] !== 0x50 || uint8[offset + 1] !== 0x4b || uint8[offset + 2] !== 0x01 || uint8[offset + 3] !== 0x02) break

        const compressionMethod = uint8[offset + 10] | (uint8[offset + 11] << 8)
        const compressedSize = uint8[offset + 20] | (uint8[offset + 21] << 8) | (uint8[offset + 22] << 16) | (uint8[offset + 23] << 24)
        const uncompressedSize = uint8[offset + 24] | (uint8[offset + 25] << 8) | (uint8[offset + 26] << 16) | (uint8[offset + 27] << 24)
        const nameLen = uint8[offset + 28] | (uint8[offset + 29] << 8)
        const extraLen = uint8[offset + 30] | (uint8[offset + 31] << 8)
        const commentLen = uint8[offset + 32] | (uint8[offset + 33] << 8)
        const localHeaderOffset = uint8[offset + 42] | (uint8[offset + 43] << 8) | (uint8[offset + 44] << 16) | (uint8[offset + 45] << 24)

        const fileName = new TextDecoder().decode(uint8.slice(offset + 46, offset + 46 + nameLen))

        // Solo procesar archivos XML de slides
        if (fileName.match(/ppt\/slides\/slide\d+\.xml$/)) {
            const localNameLen = uint8[localHeaderOffset + 26] | (uint8[localHeaderOffset + 27] << 8)
            const localExtraLen = uint8[localHeaderOffset + 28] | (uint8[localHeaderOffset + 29] << 8)
            const dataOffset = localHeaderOffset + 30 + localNameLen + localExtraLen

            if (compressionMethod === 0) {
                // No comprimido
                const content = new TextDecoder().decode(uint8.slice(dataOffset, dataOffset + uncompressedSize))
                entries.set(fileName, content)
            } else if (compressionMethod === 8) {
                // Deflate
                try {
                    const compressed = uint8.slice(dataOffset, dataOffset + compressedSize)
                    const ds = new DecompressionStream('deflate-raw')
                    const writer = ds.writable.getWriter()
                    const reader = ds.readable.getReader()

                    writer.write(compressed)
                    writer.close()

                    const chunks: Uint8Array[] = []
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        chunks.push(value)
                    }

                    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0)
                    const result = new Uint8Array(totalLength)
                    let pos = 0
                    for (const chunk of chunks) {
                        result.set(chunk, pos)
                        pos += chunk.length
                    }

                    entries.set(fileName, new TextDecoder().decode(result))
                } catch {
                    // Skip corrupted entries
                }
            }
        }

        offset += 46 + nameLen + extraLen + commentLen
    }

    return entries
}

function extractTextFromXML(xml: string): string {
    // Extraer texto de tags <a:t> (texto en OOXML)
    const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g)
    if (!matches) return ''

    return matches
        .map(m => {
            const text = m.replace(/<[^>]+>/g, '')
            return text
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
}

// ===== API Principal =====

export type SupportedFileType = 'pdf' | 'docx' | 'pptx' | 'xlsx'

export function getFileType(fileName: string): SupportedFileType | null {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return 'pdf'
    if (ext === 'docx') return 'docx'
    if (ext === 'pptx') return 'pptx'
    if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
    return null
}

export function getFileIcon(type: string): string {
    switch (type) {
        case 'pdf': return '📕'
        case 'docx': return '📘'
        case 'pptx': return '📙'
        case 'xlsx': return '📗'
        default: return '📄'
    }
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export async function extractTextFromFile(file: File): Promise<string> {
    const fileType = getFileType(file.name)

    if (!fileType) {
        throw new Error(`Tipo de archivo no soportado: ${file.name}. Usa PDF, DOCX, PPTX o XLSX.`)
    }

    try {
        switch (fileType) {
            case 'pdf':
                return await parsePDF(file)
            case 'docx':
                return await parseDOCX(file)
            case 'pptx':
                return await parsePPTX(file)
            case 'xlsx':
                return await parseXLSX(file)
            default:
                throw new Error(`Tipo no soportado: ${fileType}`)
        }
    } catch (error: any) {
        console.error(`Error parsing ${fileType}:`, error)
        throw new Error(`Error al leer el archivo ${file.name}: ${error.message}`)
    }
}
