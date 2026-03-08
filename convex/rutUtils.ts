/**
 * Utilidades para el manejo de RUT Chilenos en Convex
 */

export function calculateRutDV(rutBody: string | number): string {
    const cleanBox = String(rutBody).replace(/[^\d]/g, '');
    if (!cleanBox) return '';

    let sum = 0;
    let multiplier = 2;

    for (let i = cleanBox.length - 1; i >= 0; i--) {
        sum += parseInt(cleanBox[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const rest = sum % 11;
    const dvResult = 11 - rest;

    if (dvResult === 11) return '0';
    if (dvResult === 10) return 'K';
    return String(dvResult);
}

export function formatRutWithDV(rutBody: string | number): string {
    const body = String(rutBody).replace(/[^\d]/g, '');
    if (!body) return '';
    const dv = calculateRutDV(body);
    return `${body}-${dv}`;
}

export function normalizeRut(rut: string): string {
    // Retorna el RUT con guion y DV calculado si solo vienen números
    const clean = rut.replace(/[^\dkK]/g, '').toUpperCase();
    if (!clean) return '';

    if (clean.includes('-')) return clean;

    // Si no tiene guion, asumimos que es un RUT sin DV (como los de la imagen del usuario)
    // O si tiene DV pero no guion, intentamos detectarlo
    // Pero según el usuario: "los Rut deben tener un digito verificador, no te lo muestra en el excel"
    // Así que lo calculamos siempre si no tiene guion.

    const body = clean.replace(/[^\d]/g, '');
    return formatRutWithDV(body);
}

export function cleanForComparison(rut: string): string {
    return rut.replace(/[^\dkK]/g, '').toUpperCase();
}
