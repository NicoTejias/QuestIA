export interface DuocCareer {
    name: string;
    school: string;
}

export const DUOC_SCHOOLS = [
    "Administración y Negocios",
    "Comunicación",
    "Construcción",
    "Diseño",
    "Gastronomía",
    "Informática y Telecomunicaciones",
    "Ingeniería y Recursos Naturales",
    "Salud y Bienestar",
    "Turismo y Hospitalidad",
] as const;

export const DUOC_CAREERS: DuocCareer[] = [
    // ─── Ingeniería y Recursos Naturales ─────────────────────────────────────
    { school: "Ingeniería y Recursos Naturales", name: "Ingeniería Agrícola" },
    { school: "Ingeniería y Recursos Naturales", name: "Ingeniería en Automatización y Control Industrial" },
    { school: "Ingeniería y Recursos Naturales", name: "Ingeniería en Electricidad y Automatización Industrial" },
    { school: "Ingeniería y Recursos Naturales", name: "Ingeniería en Mantenimiento Industrial" },
    { school: "Ingeniería y Recursos Naturales", name: "Ingeniería en Maquinaria y Vehículos Pesados" },
    { school: "Ingeniería y Recursos Naturales", name: "Ingeniería en Mecánica Automotriz y Autotrónica" },
    { school: "Ingeniería y Recursos Naturales", name: "Ingeniería en Medio Ambiente" },
    { school: "Ingeniería y Recursos Naturales", name: "Ingeniería Industrial" },
    { school: "Ingeniería y Recursos Naturales", name: "Técnico Agrícola" },
    { school: "Ingeniería y Recursos Naturales", name: "Técnico en Calidad de Alimentos" },
    { school: "Ingeniería y Recursos Naturales", name: "Técnico en Control y Monitoreo Remoto de Procesos Mineros" },
    { school: "Ingeniería y Recursos Naturales", name: "Técnico en Electricidad y Automatización Industrial" },
    { school: "Ingeniería y Recursos Naturales", name: "Técnico en Electricidad y Energías Renovables" },
    { school: "Ingeniería y Recursos Naturales", name: "Técnico en Geología" },
    { school: "Ingeniería y Recursos Naturales", name: "Técnico en Mantenimiento Industrial" },
    { school: "Ingeniería y Recursos Naturales", name: "Técnico en Maquinaria y Vehículos Pesados" },
    { school: "Ingeniería y Recursos Naturales", name: "Técnico en Mecánica Automotriz y Autotrónica" },
    { school: "Ingeniería y Recursos Naturales", name: "Técnico en Operación y Supervisión de Procesos Mineros" },
    { school: "Ingeniería y Recursos Naturales", name: "Técnico Veterinario y Pecuario" },

    // ─── Administración y Negocios ────────────────────────────────────────────
    // (se completa cuando el usuario pase la lista)

    // ─── Comunicación ─────────────────────────────────────────────────────────

    // ─── Construcción ─────────────────────────────────────────────────────────

    // ─── Diseño ───────────────────────────────────────────────────────────────

    // ─── Gastronomía ──────────────────────────────────────────────────────────

    // ─── Informática y Telecomunicaciones ─────────────────────────────────────

    // ─── Salud y Bienestar ────────────────────────────────────────────────────

    // ─── Turismo y Hospitalidad ───────────────────────────────────────────────
];

export function getCareersBySchool(school: string): DuocCareer[] {
    return DUOC_CAREERS.filter(c => c.school === school);
}
