import * as XLSX from 'xlsx'

/**
 * Utilidad para exportar datos del dashboard a formatos legibles por el docente (Excel/CSV)
 */

export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Datos') {
    if (!data || data.length === 0) {
        console.error('No hay datos para exportar')
        return
    }

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Generar buffer y descargar
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

/**
 * Formatea los datos del ranking para una exportación limpia
 */
export function formatRankingForExport(rankingData: any[]) {
    return rankingData.map((item, index) => ({
        'Posición': index + 1,
        'Nombre': item.name || 'N/A',
        'RUT/ID': item.student_id || item.rut || 'N/A',
        'Sección': item.section || 'N/A',
        'Rol Belbin': item.belbin || item.belbin_role || 'No realizado',
        'Puntos Totales': item.points || item.ranking_points || 0,
        'Puntos Canjeables': item.spendable_points || 0,
        'Misiones Completadas': item.missions_completed || 0
    }))
}
