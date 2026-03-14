/**
 * Utilidades para el Dashboard del Alumno
 */

export function getGreeting(): string {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 20) return 'Buenas tardes'
    return 'Buenas noches'
}

export function getFirstName(fullName?: string): string {
    if (!fullName) return ''
    return fullName.split(' ')[0]
}
