import { supabase } from '../lib/supabase'

export interface EstadoDocumentosMaleta {
  tienePDA: boolean
  tienePIA: boolean
  tienePA: boolean
  completo: boolean
  faltantes: ('PDA' | 'PIA' | 'PA')[]
  documentos: any[]
}

export const AvaSyncService = {
  /**
   * Verifica la existencia de los documentos maestros (PDA, PIA, PA) para un ramo específico en Supabase.
   */
  async verificarDocumentosMaestros(courseId: string): Promise<EstadoDocumentosMaleta> {
    const { data: docs, error } = await supabase
      .from('course_documents')
      .select('id, file_name, file_type, file_size, master_doc_type, is_master_doc, uploaded_at')
      .eq('course_id', courseId)

    if (error) {
      console.error('Error verificando documentos maestros:', error)
      return {
        tienePDA: false,
        tienePIA: false,
        tienePA: false,
        completo: false,
        faltantes: ['PDA', 'PIA', 'PA'],
        documentos: []
      }
    }

    const docList = docs || []
    const tienePDA = docList.some(d => d.master_doc_type === 'PDA' || d.file_name?.toUpperCase().includes('PDA'))
    const tienePIA = docList.some(d => d.master_doc_type === 'PIA' || d.file_name?.toUpperCase().includes('PIA'))
    const tienePA = docList.some(d => d.master_doc_type === 'PA' || d.file_name?.toUpperCase().includes('PA'))

    const faltantes: ('PDA' | 'PIA' | 'PA')[] = []
    if (!tienePDA) faltantes.push('PDA')
    if (!tienePIA) faltantes.push('PIA')
    if (!tienePA) faltantes.push('PA')

    return {
      tienePDA,
      tienePIA,
      tienePA,
      completo: faltantes.length === 0,
      faltantes,
      documentos: docList
    }
  },

  /**
   * Registra un documento oficial (PDA, PIA, PA o Material de EA) subido por el docente
   */
  async registrarDocumentoOficial(params: {
    courseId: string
    teacherId: string
    fileName: string
    fileType: string
    fileSize: number
    contentText: string
    docType: 'PDA' | 'PIA' | 'PA' | 'MALETA'
  }) {
    const payload = {
      course_id: params.courseId,
      teacher_id: params.teacherId,
      file_name: params.fileName,
      file_type: params.fileType,
      file_size: params.fileSize,
      file_path: `maleta/${params.courseId}/${params.docType}_${Date.now()}.${params.fileType}`,
      content_text: params.contentText,
      is_master_doc: true,
      master_doc_type: params.docType,
      uploaded_at: Date.now(),
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('course_documents')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Intenta consultar el estado de conectividad con el daemon de Blackboard AVA en el servidor Ubuntu (192.168.0.202)
   */
  async verificarConexionDaemon(): Promise<{ online: boolean; mensaje: string }> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
      const res = await fetch('http://192.168.0.202:9222/json/version', { signal: controller.signal })
      clearTimeout(timeoutId)
      if (res.ok) {
        return { online: true, mensaje: 'Conexión activa con el entorno AVA / Vivo Duoc en Ubuntu Server.' }
      }
    } catch {
      // Servidor no accesible directamente por CORS o firewall en navegador cliente
    }
    return {
      online: false,
      mensaje: 'El servicio AVA / Vivo Duoc se encuentra en espera de sesión o ejecutándose en red local.'
    }
  }
}
