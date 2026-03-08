/**
 * Utilidades para el manejo de RUT Chilenos (Cálculo de DV, Validación, Formateo)
 */

/**
 * Calcula el Dígito Verificador de un RUT (sin puntos ni guion)
 * Siguiendo el algoritmo de Módulo 11 (2,3,4,5,6,7)
 */
export function calculateRutDV(rutBody: string | number): string {
    const cleanRut = String(rutBody).replace(/[^\d]/g, '');
    if (!cleanRut) return '';

    let sum = 0;
    let multiplier = 2;

    // Invertir y multiplicar por la serie 2,3,4,5,6,7
    for (let i = cleanRut.length - 1; i >= 0; i--) {
        sum += parseInt(cleanRut[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const rest = sum % 11;
    const dvResult = 11 - rest;

    if (dvResult === 11) return '0';
    if (dvResult === 10) return 'K';
    return String(dvResult);
}

/**
 * Formatea un RUT agregando el dígito verificador calculado
 * Ejemplo: 12345678 -> 12345678-5
 */
export function formatRutWithDV(rutBody: string | number): string {
    const body = String(rutBody).replace(/[^\d]/g, '');
    if (!body) return '';
    const dv = calculateRutDV(body);
    return `${body}-${dv}`;
}

/**
 * Limpia un RUT dejando solo números y la K final si existe
 * Útil para comparaciones en la base de datos
 */
export function cleanRut(rut: string): string {
    return rut.replace(/[^\dkK]/g, '').toUpperCase();
}
