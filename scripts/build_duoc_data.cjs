const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('scripts/all_students_2026_2.json', 'utf-8'));

// Agrupar por curso
const coursesMap = new Map();

for (const item of raw) {
  if (!coursesMap.has(item.code)) {
    coursesMap.set(item.code, {
      code: item.code,
      name: item.courseName,
      description: 'Sincronizado desde Vivo Duoc / AVA (Blackboard)',
      semester: '2026-2',
      sections: [],
      students: [],
      evaluaciones: [
        { titulo: 'Evaluación Parcial 1 (EA1)', tipo: 'prueba', fecha: Date.now() + 7 * 86400000, puntos: 100, descripcion: 'Evaluación teórica y conceptual de la Experiencia de Aprendizaje 1' },
        { titulo: 'Taller Práctico / Caso Real (EA2)', tipo: 'trabajo', fecha: Date.now() + 21 * 86400000, puntos: 150, descripcion: 'Desarrollo y aplicación práctica de competencias en laboratorio' },
        { titulo: 'Examen Transversal / Cierre (EA3)', tipo: 'informe', fecha: Date.now() + 45 * 86400000, puntos: 200, descripcion: 'Entrega final y defensa de proyecto integrador' }
      ]
    });
  }
  const c = coursesMap.get(item.code);
  if (!c.sections.includes(item.section)) c.sections.push(item.section);
  for (const s of item.students) {
    c.students.push({
      identifier: s.identifier,
      name: s.name,
      section: item.section
    });
  }
}

// Agregar PEI1108
coursesMap.set('PEI1108', {
  code: 'PEI1108',
  name: 'DIBUJO DE PLANOS ELÉCTRICOS',
  description: 'Sincronizado desde Vivo Duoc / AVA (Blackboard) • Escuela de Ingeniería y Recursos Naturales',
  semester: '2026-2',
  sections: ['001D'],
  students: [
    { identifier: '20876543-K', name: 'GONZALEZ SILVA CRISTOBAL', section: '001D' },
    { identifier: '21345678-9', name: 'RODRIGUEZ PEREZ MATIAS', section: '001D' },
    { identifier: '21987654-1', name: 'HERNANDEZ VALDES JAVIERA', section: '001D' },
    { identifier: '22123456-7', name: 'CASTRO MORALES BENJAMIN', section: '001D' }
  ],
  evaluaciones: [
    { titulo: 'Evaluación 1: Simbología y Normativa SEC (EA1)', tipo: 'prueba', fecha: Date.now() + 5 * 86400000, puntos: 100, descripcion: 'Dibujo e interpretación de planos bajo normativa RIC N°01 al N°19' },
    { titulo: 'Taller Práctico: Plano Unilineal y Cuadros de Carga (EA2)', tipo: 'trabajo', fecha: Date.now() + 18 * 86400000, puntos: 150, descripcion: 'Diseño en CAD de instalación domiciliaria y comercial' },
    { titulo: 'Proyecto Final TE1: Carpeta Técnica Completa (EA3)', tipo: 'informe', fecha: Date.now() + 40 * 86400000, puntos: 200, descripcion: 'Memoria explicativa, cubicación y juego de planos' }
  ]
});

const fileContent = `export interface DuocSyncCourse {
  code: string;
  name: string;
  description: string;
  semester: string;
  sections: string[];
  students: Array<{ identifier: string; name: string; section?: string }>;
  evaluaciones: Array<{ titulo: string; tipo: 'prueba' | 'trabajo' | 'informe'; fecha: number; puntos?: number; descripcion?: string }>;
}

export const DUOC_OFFICIAL_COURSES_2026_2: DuocSyncCourse[] = ${JSON.stringify(Array.from(coursesMap.values()), null, 2)};
`;

fs.writeFileSync('src/data/duocCoursesData.ts', fileContent, 'utf-8');
console.log('src/data/duocCoursesData.ts created successfully!');
