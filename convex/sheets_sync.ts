"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { JWT } from "google-auth-library";

// Helper: obtener access token para Google Sheets API via service account
async function getGoogleAccessToken(): Promise<string> {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountStr) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT no configurada en Convex");
    }

    const serviceAccount = JSON.parse(serviceAccountStr);
    const jwtClient = new JWT({
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const { token } = await jwtClient.getAccessToken();
    if (!token) throw new Error("No se pudo obtener token de Google");
    return token;
}

// Helper: normalizar RUT
function normalizeRut(raw: string): string {
    return raw.replace(/\./g, '').replace(/\s/g, '').toUpperCase().trim();
}

// Helper: leer datos de un Google Sheets y extraer alumnos
async function fetchSheetsData(
    sheetsId: string,
    accessToken: string
): Promise<{ identifier: string; name: string; section?: string }[]> {
    // Leer metadata para obtener nombre de la primera hoja
    const metaResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}?fields=sheets.properties.title`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!metaResponse.ok) {
        const err = await metaResponse.json();
        throw new Error(`Error accediendo al Sheets: ${err.error?.message || metaResponse.statusText}`);
    }
    const meta = await metaResponse.json();
    const firstSheet = meta.sheets?.[0]?.properties?.title || "Sheet1";

    // Leer datos de la primera hoja
    const dataResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/${encodeURIComponent(firstSheet)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!dataResponse.ok) {
        const err = await dataResponse.json();
        throw new Error(`Error leyendo datos: ${err.error?.message || dataResponse.statusText}`);
    }
    const data = await dataResponse.json();
    const rows: string[][] = data.values || [];

    if (rows.length < 2) return [];

    const findCol = (headers: string[], keywords: string[]): number => {
        for (const kw of keywords) {
            const idx = headers.findIndex(h =>
                h && typeof h === 'string' && h.toLowerCase().includes(kw.toLowerCase())
            );
            if (idx !== -1) return idx;
        }
        return -1;
    };

    // Buscar fila de headers (puede no ser la primera)
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
        const row = (rows[i] || []).map(c => String(c || '').toLowerCase());
        if (row.some(c => c.includes('rut') || c.includes('alumno') || c.includes('matrícula') || c.includes('matricula'))) {
            headerRowIdx = i;
            break;
        }
    }

    const headers = (rows[headerRowIdx] || []).map(h => String(h || ''));
    const dataRows = rows.slice(headerRowIdx + 1);

    const rutCol = findCol(headers, ['rut alumno', 'rut', 'matrícula', 'matricula', 'identificador', 'id alumno']);
    const nombresCol = findCol(headers, ['nombres', 'nombre']);
    const apPaternoCol = findCol(headers, ['apellido paterno', 'ap. paterno', 'paterno']);
    const apMaternoCol = findCol(headers, ['apellido materno', 'ap. materno', 'materno']);
    const seccionCol = findCol(headers, ['sección', 'seccion', 'grupo', 'curso']);

    // Si no hay columna de RUT explícita, buscar primera columna numérica
    const effectiveRutCol = rutCol !== -1 ? rutCol : (() => {
        for (let i = 0; i < (dataRows[0]?.length || 0); i++) {
            const val = String(dataRows[0]?.[i] || '').replace(/\./g, '');
            if (/^\d{6,}/.test(val)) return i;
        }
        return 0;
    })();

    const students: { identifier: string; name: string; section?: string }[] = [];

    for (const row of dataRows) {
        const rawId = String(row[effectiveRutCol] || '').trim();
        const normalized = normalizeRut(rawId);
        if (normalized.length < 4) continue;

        const parts: string[] = [];
        if (nombresCol !== -1) parts.push(String(row[nombresCol] || '').trim());
        if (apPaternoCol !== -1) parts.push(String(row[apPaternoCol] || '').trim());
        if (apMaternoCol !== -1) parts.push(String(row[apMaternoCol] || '').trim());
        const name = parts.filter(Boolean).join(' ');

        const section = seccionCol !== -1 ? String(row[seccionCol] || '').trim() || undefined : undefined;

        students.push({ identifier: normalized, name, section });
    }

    return students;
}

// ─── Action pública: Sincronizar un ramo desde su Google Sheets vinculado ────

export const syncCourseFromSheets = action({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args): Promise<{ added: number; updated: number; removed: number; total: number }> => {
        const course = await ctx.runQuery(api.courses.getCourseById, { courseId: args.course_id });
        if (!course || !course.linked_sheets_id) {
            throw new Error("Este ramo no tiene un Google Sheets vinculado");
        }

        const accessToken = await getGoogleAccessToken();
        const students = await fetchSheetsData(course.linked_sheets_id, accessToken);

        if (students.length === 0) {
            return { added: 0, updated: 0, removed: 0, total: 0 };
        }

        // Ejecutar sync inteligente
        const result: { added: number; updated: number; removed: number } = await ctx.runMutation(api.courses.batchUploadWhitelist, {
            course_id: args.course_id,
            students: students.map(s => ({
                identifier: s.identifier,
                name: s.name || undefined,
                section: s.section || undefined,
            })),
            sync_mode: true,
        });

        // Actualizar timestamp de último sync
        await ctx.runMutation(api.courses.updateLastSheetsSync, {
            course_id: args.course_id,
        });

        return { added: result.added, updated: result.updated, removed: result.removed, total: students.length };
    },
});

// ─── Action interna: Sincronizar TODOS los ramos vinculados (para cron) ──────

export const syncAllLinkedCourses = internalAction({
    args: {},
    handler: async (ctx) => {
        const courses = await ctx.runQuery(internal.courses.getCoursesWithLinkedSheets);

        let synced = 0;
        let errors = 0;

        for (const course of courses) {
            try {
                const accessToken = await getGoogleAccessToken();
                const students = await fetchSheetsData(course.linked_sheets_id!, accessToken);

                if (students.length > 0) {
                    await ctx.runMutation(api.courses.batchUploadWhitelist, {
                        course_id: course._id,
                        students: students.map(s => ({
                            identifier: s.identifier,
                            name: s.name || undefined,
                            section: s.section || undefined,
                        })),
                        sync_mode: true,
                    });

                    await ctx.runMutation(api.courses.updateLastSheetsSync, {
                        course_id: course._id,
                    });
                }
                synced++;
            } catch (e) {
                console.error(`Error syncing course ${course.name} (${course.code}):`, e);
                errors++;
            }
        }

        console.log(`Sheets sync completado: ${synced} ramos sincronizados, ${errors} errores`);
        return { synced, errors };
    },
});
