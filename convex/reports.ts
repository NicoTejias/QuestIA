import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// ─── Tipos internos ────────────────────────────────────────────────────────────

interface CourseStats {
    name: string;
    code: string;
    teacherName: string;
    enrolled: number;
    whitelisted: number;
    quizAvg: number | null;
    quizzesCount: number;
    quizSubmissionsCount: number;
    missionsCount: number;
    missionsDoneCount: number;
    upcomingEvalsCount: number;
    upcomingEvals: { titulo: string; tipo: string; fecha: number }[];
}

interface AtRiskStudent {
    name: string;
    email: string;
    days: number;
}

interface CoordinatorReportData {
    careerName: string;
    period: string;
    totalWhitelisted: number;
    totalEnrolled: number;
    adoptionRate: number;
    avgQuizScore: number | null;
    atRiskStudents: AtRiskStudent[];
    coursesData: CourseStats[];
}

interface TeacherSummary {
    name: string;
    email: string;
    coursesCount: number;
    quizzesCreated: number;
    missionsCreated: number;
    avgQuizScore: number | null;
}

interface DirectorReportData {
    careerName: string;
    month: string;
    totalWhitelisted: number;
    totalEnrolled: number;
    adoptionRate: number;
    avgQuizScore: number | null;
    atRiskCount: number;
    totalQuizSubmissions: number;
    totalMissionsDone: number;
    coursesData: CourseStats[];
    teachersSummary: TeacherSummary[];
}

// ─── Constantes de colores para el email ─────────────────────────────────────

const PURPLE = "#7c3aed";
const PURPLE_LIGHT = "#ede9fe";
const PURPLE_DARK = "#4c1d95";
const GREEN = "#059669";
const GREEN_LIGHT = "#d1fae5";
const AMBER = "#d97706";
const AMBER_LIGHT = "#fef3c7";
const RED = "#dc2626";
const RED_LIGHT = "#fee2e2";
const SLATE = "#64748b";
const BG = "#f5f3ff";
const WHITE = "#ffffff";

// ─── Helper: formato fecha ────────────────────────────────────────────────────

function fmtDate(ts: number) {
    return new Date(ts).toLocaleDateString("es-CL", {
        day: "numeric", month: "long", year: "numeric",
    });
}

function scoreColor(score: number | null): string {
    if (score === null) return SLATE;
    if (score >= 70) return GREEN;
    if (score >= 50) return AMBER;
    return RED;
}

function scoreBg(score: number | null): string {
    if (score === null) return "#f1f5f9";
    if (score >= 70) return GREEN_LIGHT;
    if (score >= 50) return AMBER_LIGHT;
    return RED_LIGHT;
}

function adoptionColor(rate: number): string {
    if (rate >= 70) return GREEN;
    if (rate >= 40) return AMBER;
    return RED;
}

// ─── Template: encabezado común ──────────────────────────────────────────────

function emailHeader(title: string, subtitle: string, period: string): string {
    return `
    <tr>
      <td style="background:linear-gradient(135deg,${PURPLE} 0%,#a78bfa 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
        <p style="color:#c4b5fd;margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">QUESTIA · INFORME INSTITUCIONAL</p>
        <h1 style="color:${WHITE};margin:0 0 8px;font-size:26px;font-weight:900;letter-spacing:-0.5px;">${title}</h1>
        <p style="color:#ede9fe;margin:0;font-size:15px;font-weight:600;">${subtitle}</p>
        <p style="color:#c4b5fd;margin:10px 0 0;font-size:12px;">📅 ${period}</p>
      </td>
    </tr>`;
}

function emailFooter(): string {
    return `
    <tr>
      <td style="background:#1e1b4b;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
        <p style="color:#a5b4fc;margin:0;font-size:11px;">
          Generado automáticamente por <strong style="color:${WHITE};">QuestIA</strong> · Plataforma de Gamificación Educativa
        </p>
        <p style="color:#6366f1;margin:8px 0 0;font-size:10px;letter-spacing:1px;">
          Este reporte es confidencial y está destinado únicamente al destinatario indicado.
        </p>
      </td>
    </tr>`;
}

function kpiCard(label: string, value: string, detail: string, color: string, bg: string): string {
    return `
    <td style="width:33%;padding:4px;">
      <div style="background:${bg};border-radius:12px;padding:20px 12px;text-align:center;">
        <p style="color:${color};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">${label}</p>
        <p style="color:${PURPLE_DARK};font-size:28px;font-weight:900;margin:0;line-height:1;">${value}</p>
        <p style="color:${color};font-size:11px;margin:6px 0 0;">${detail}</p>
      </div>
    </td>`;
}

// ─── HTML: Reporte Coordinador (semanal) ─────────────────────────────────────

function buildCoordinatorHtml(data: CoordinatorReportData): string {
    const { careerName, period, adoptionRate, avgQuizScore,
        totalEnrolled, totalWhitelisted, atRiskStudents, coursesData } = data;

    const atRiskHigh = atRiskStudents.filter(s => s.days >= 14);
    const atRiskMed = atRiskStudents.filter(s => s.days >= 7 && s.days < 14);

    // KPI cards row
    const kpis = `
    <tr>
      <td style="background:${WHITE};padding:28px 32px;">
        <p style="color:${SLATE};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">Resumen de la Semana</p>
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          ${kpiCard("Adopción", `${adoptionRate}%`, `${totalEnrolled} de ${totalWhitelisted} alumnos`, adoptionColor(adoptionRate), adoptionRate >= 70 ? GREEN_LIGHT : adoptionRate >= 40 ? AMBER_LIGHT : RED_LIGHT)}
          ${kpiCard("Rendimiento Quiz", avgQuizScore !== null ? `${avgQuizScore}%` : "Sin datos", avgQuizScore !== null ? (avgQuizScore >= 70 ? "✅ Buen nivel" : avgQuizScore >= 50 ? "⚠️ Mejorable" : "❌ Bajo") : "Sin quizzes esta semana", scoreColor(avgQuizScore), scoreBg(avgQuizScore))}
          ${kpiCard("En Riesgo", `${atRiskStudents.length}`, atRiskHigh.length > 0 ? `🚨 ${atRiskHigh.length} críticos` : atRiskStudents.length === 0 ? "✅ Sin alertas" : `${atRiskMed.length} moderados`, atRiskStudents.length === 0 ? GREEN : atRiskHigh.length > 0 ? RED : AMBER, atRiskStudents.length === 0 ? GREEN_LIGHT : atRiskHigh.length > 0 ? RED_LIGHT : AMBER_LIGHT)}
        </tr></table>
      </td>
    </tr>`;

    // At-risk students section
    const atRiskSection = atRiskStudents.length === 0 ? `
    <tr>
      <td style="background:${GREEN_LIGHT};border-left:4px solid ${GREEN};padding:20px 32px;">
        <p style="color:${GREEN};font-weight:700;margin:0;">✅ Sin alumnos en riesgo esta semana</p>
        <p style="color:#065f46;font-size:13px;margin:4px 0 0;">Todos los alumnos mantienen actividad reciente en la plataforma.</p>
      </td>
    </tr>` : `
    <tr>
      <td style="background:${WHITE};padding:24px 32px;">
        <p style="color:${SLATE};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">⚠️ Alumnos en Riesgo de Deserción</p>
        ${atRiskHigh.length > 0 ? `
        <div style="background:${RED_LIGHT};border-left:4px solid ${RED};border-radius:0 8px 8px 0;padding:16px;margin-bottom:12px;">
          <p style="color:${RED};font-weight:700;font-size:13px;margin:0 0 8px;">🚨 Crítico — Más de 14 días sin actividad (${atRiskHigh.length} alumnos)</p>
          ${atRiskHigh.map(s => `<p style="color:#7f1d1d;font-size:12px;margin:2px 0;">• ${s.name} <span style="color:${RED};font-weight:700;">(${s.days} días)</span> — ${s.email}</p>`).join("")}
        </div>` : ""}
        ${atRiskMed.length > 0 ? `
        <div style="background:${AMBER_LIGHT};border-left:4px solid ${AMBER};border-radius:0 8px 8px 0;padding:16px;">
          <p style="color:${AMBER};font-weight:700;font-size:13px;margin:0 0 8px;">⚠️ Moderado — Entre 7 y 14 días sin actividad (${atRiskMed.length} alumnos)</p>
          ${atRiskMed.map(s => `<p style="color:#78350f;font-size:12px;margin:2px 0;">• ${s.name} <span style="color:${AMBER};font-weight:700;">(${s.days} días)</span> — ${s.email}</p>`).join("")}
        </div>` : ""}
      </td>
    </tr>`;

    // Courses table
    const courseRows = coursesData.map(c => `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:12px 8px;">
        <p style="color:#1e1b4b;font-weight:700;font-size:13px;margin:0;">${c.name}</p>
        <p style="color:${SLATE};font-size:11px;font-family:monospace;margin:2px 0 0;">${c.code} · ${c.teacherName}</p>
      </td>
      <td style="text-align:center;padding:12px 8px;">
        <span style="color:${adoptionColor(c.whitelisted > 0 ? Math.round(c.enrolled / c.whitelisted * 100) : 0)};font-weight:700;font-size:13px;">${c.enrolled}/${c.whitelisted}</span>
      </td>
      <td style="text-align:center;padding:12px 8px;">
        <span style="background:${scoreBg(c.quizAvg)};color:${scoreColor(c.quizAvg)};font-weight:700;font-size:13px;padding:4px 10px;border-radius:20px;">
          ${c.quizAvg !== null ? `${c.quizAvg}%` : "—"}
        </span>
      </td>
      <td style="text-align:center;padding:12px 8px;color:${SLATE};font-size:13px;">${c.missionsDoneCount}/${c.missionsCount > 0 ? c.missionsCount + " misiones" : "0"}</td>
      <td style="text-align:center;padding:12px 8px;">
        ${c.upcomingEvalsCount > 0
            ? `<span style="background:${PURPLE_LIGHT};color:${PURPLE};font-weight:700;font-size:11px;padding:4px 8px;border-radius:20px;">📅 ${c.upcomingEvalsCount} próxima(s)</span>`
            : `<span style="color:#cbd5e1;font-size:12px;">—</span>`}
      </td>
    </tr>`).join("");

    const coursesSection = `
    <tr>
      <td style="background:${WHITE};padding:24px 32px;">
        <p style="color:${SLATE};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">📚 Detalle por Ramo</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr style="background:${BG};">
            <th style="text-align:left;padding:10px 8px;font-size:10px;color:${SLATE};font-weight:700;letter-spacing:1px;text-transform:uppercase;">Ramo</th>
            <th style="text-align:center;padding:10px 8px;font-size:10px;color:${SLATE};font-weight:700;letter-spacing:1px;text-transform:uppercase;">Alumnos</th>
            <th style="text-align:center;padding:10px 8px;font-size:10px;color:${SLATE};font-weight:700;letter-spacing:1px;text-transform:uppercase;">Quiz Prom.</th>
            <th style="text-align:center;padding:10px 8px;font-size:10px;color:${SLATE};font-weight:700;letter-spacing:1px;text-transform:uppercase;">Misiones</th>
            <th style="text-align:center;padding:10px 8px;font-size:10px;color:${SLATE};font-weight:700;letter-spacing:1px;text-transform:uppercase;">Evaluaciones</th>
          </tr>
          ${courseRows || `<tr><td colspan="5" style="text-align:center;color:${SLATE};padding:24px;font-size:13px;">No hay ramos asignados a esta carrera aún.</td></tr>`}
        </table>
      </td>
    </tr>`;

    // Upcoming evals across all courses
    const allUpcoming = coursesData.flatMap(c => c.upcomingEvals.map(e => ({ ...e, courseName: c.name })));
    const evalsSection = allUpcoming.length === 0 ? "" : `
    <tr>
      <td style="background:${PURPLE_LIGHT};padding:24px 32px;">
        <p style="color:${PURPLE_DARK};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">📅 Evaluaciones Esta Semana</p>
        ${allUpcoming.sort((a, b) => a.fecha - b.fecha).map(e => `
        <div style="background:${WHITE};border-radius:8px;padding:12px 16px;margin-bottom:8px;border-left:3px solid ${PURPLE};">
          <p style="color:#1e1b4b;font-weight:700;font-size:13px;margin:0;">${e.titulo}</p>
          <p style="color:${SLATE};font-size:12px;margin:4px 0 0;">${e.courseName} · ${e.tipo.charAt(0).toUpperCase() + e.tipo.slice(1)} · ${fmtDate(e.fecha)}</p>
        </div>`).join("")}
      </td>
    </tr>`;

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#e8e4f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#e8e4f5;">
<tr><td align="center" style="padding:24px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.15);">
  ${emailHeader("Reporte Semanal", `Coordinación de Carrera · ${careerName}`, period)}
  ${kpis}
  <tr><td style="background:#f8f7ff;height:1px;"></td></tr>
  ${atRiskSection}
  <tr><td style="background:#f8f7ff;height:1px;"></td></tr>
  ${coursesSection}
  ${evalsSection}
  ${emailFooter()}
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── HTML: Reporte Jefe/Director (mensual) ────────────────────────────────────

function buildDirectorHtml(data: DirectorReportData): string {
    const { careerName, month, adoptionRate, avgQuizScore,
        totalEnrolled, totalWhitelisted, atRiskCount,
        totalQuizSubmissions, totalMissionsDone, coursesData, teachersSummary } = data;

    const kpis = `
    <tr>
      <td style="background:${WHITE};padding:28px 32px;">
        <p style="color:${SLATE};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">KPIs del Mes</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${kpiCard("Adopción", `${adoptionRate}%`, `${totalEnrolled}/${totalWhitelisted} alumnos`, adoptionColor(adoptionRate), adoptionRate >= 70 ? GREEN_LIGHT : adoptionRate >= 40 ? AMBER_LIGHT : RED_LIGHT)}
            ${kpiCard("Rendimiento IA", avgQuizScore !== null ? `${avgQuizScore}%` : "Sin datos", `${totalQuizSubmissions} evaluaciones`, scoreColor(avgQuizScore), scoreBg(avgQuizScore))}
            ${kpiCard("Alumnos en Riesgo", `${atRiskCount}`, atRiskCount === 0 ? "✅ Sin alertas" : "Requieren atención", atRiskCount === 0 ? GREEN : atRiskCount > 5 ? RED : AMBER, atRiskCount === 0 ? GREEN_LIGHT : atRiskCount > 5 ? RED_LIGHT : AMBER_LIGHT)}
          </tr>
          <tr style="height:12px;"></tr>
          <tr>
            ${kpiCard("Misiones Completadas", `${totalMissionsDone}`, `en ${coursesData.length} ramos`, PURPLE, PURPLE_LIGHT)}
            ${kpiCard("Ramos Activos", `${coursesData.length}`, `${teachersSummary.length} docentes`, "#0891b2", "#e0f2fe")}
            ${kpiCard("Interacciones Quiz", `${totalQuizSubmissions}`, "entregas en la plataforma", "#7c3aed", "#ede9fe")}
          </tr>
        </table>
      </td>
    </tr>`;

    // Course ranking table (sorted by quiz avg)
    const sortedCourses = [...coursesData].sort((a, b) =>
        (b.quizAvg ?? -1) - (a.quizAvg ?? -1)
    );

    const courseRanking = `
    <tr>
      <td style="background:${WHITE};padding:24px 32px;">
        <p style="color:${SLATE};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">🏆 Ranking de Ramos por Rendimiento</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr style="background:${BG};">
            <th style="text-align:left;padding:10px 8px;font-size:10px;color:${SLATE};text-transform:uppercase;letter-spacing:1px;">#</th>
            <th style="text-align:left;padding:10px 8px;font-size:10px;color:${SLATE};text-transform:uppercase;letter-spacing:1px;">Ramo</th>
            <th style="text-align:center;padding:10px 8px;font-size:10px;color:${SLATE};text-transform:uppercase;letter-spacing:1px;">Alumnos</th>
            <th style="text-align:center;padding:10px 8px;font-size:10px;color:${SLATE};text-transform:uppercase;letter-spacing:1px;">Quiz Prom.</th>
            <th style="text-align:center;padding:10px 8px;font-size:10px;color:${SLATE};text-transform:uppercase;letter-spacing:1px;">Misiones</th>
          </tr>
          ${sortedCourses.map((c, i) => `
          <tr style="border-bottom:1px solid #f1f5f9;${i === 0 ? `background:#fffbeb;` : ""}">
            <td style="padding:12px 8px;text-align:center;">
              <span style="font-weight:900;color:${i === 0 ? "#d97706" : i === 1 ? "#94a3b8" : i === 2 ? "#c2855a" : SLATE};font-size:14px;">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</span>
            </td>
            <td style="padding:12px 8px;">
              <p style="color:#1e1b4b;font-weight:700;font-size:13px;margin:0;">${c.name}</p>
              <p style="color:${SLATE};font-size:11px;font-family:monospace;margin:2px 0 0;">${c.code}</p>
            </td>
            <td style="text-align:center;padding:12px 8px;color:${SLATE};font-size:13px;">${c.enrolled}</td>
            <td style="text-align:center;padding:12px 8px;">
              <span style="background:${scoreBg(c.quizAvg)};color:${scoreColor(c.quizAvg)};font-weight:700;font-size:13px;padding:4px 10px;border-radius:20px;">
                ${c.quizAvg !== null ? `${c.quizAvg}%` : "—"}
              </span>
            </td>
            <td style="text-align:center;padding:12px 8px;color:${SLATE};font-size:13px;">${c.missionsDoneCount}</td>
          </tr>`).join("")}
        </table>
      </td>
    </tr>`;

    // Teacher activity
    const teacherSection = `
    <tr>
      <td style="background:${BG};padding:24px 32px;">
        <p style="color:${SLATE};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">👩‍🏫 Actividad de Docentes</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${WHITE};border-radius:12px;overflow:hidden;">
          <tr style="background:${BG};">
            <th style="text-align:left;padding:10px 16px;font-size:10px;color:${SLATE};text-transform:uppercase;letter-spacing:1px;">Docente</th>
            <th style="text-align:center;padding:10px 8px;font-size:10px;color:${SLATE};text-transform:uppercase;letter-spacing:1px;">Ramos</th>
            <th style="text-align:center;padding:10px 8px;font-size:10px;color:${SLATE};text-transform:uppercase;letter-spacing:1px;">Quizzes</th>
            <th style="text-align:center;padding:10px 8px;font-size:10px;color:${SLATE};text-transform:uppercase;letter-spacing:1px;">Misiones</th>
            <th style="text-align:center;padding:10px 8px;font-size:10px;color:${SLATE};text-transform:uppercase;letter-spacing:1px;">Prom. Quiz</th>
          </tr>
          ${teachersSummary.map(t => {
        const isActive = t.quizzesCreated > 0 || t.missionsCreated > 0;
        return `
          <tr style="border-bottom:1px solid #f1f5f9;${!isActive ? "opacity:0.6;" : ""}">
            <td style="padding:12px 16px;">
              <p style="color:#1e1b4b;font-weight:700;font-size:13px;margin:0;">${t.name}${!isActive ? ` <span style="background:${AMBER_LIGHT};color:${AMBER};font-size:10px;padding:2px 6px;border-radius:10px;font-weight:700;">Sin actividad</span>` : ""}</p>
              <p style="color:${SLATE};font-size:11px;margin:2px 0 0;">${t.email}</p>
            </td>
            <td style="text-align:center;padding:12px 8px;color:${SLATE};font-size:13px;">${t.coursesCount}</td>
            <td style="text-align:center;padding:12px 8px;color:${t.quizzesCreated > 0 ? PURPLE : SLATE};font-weight:${t.quizzesCreated > 0 ? "700" : "400"};font-size:13px;">${t.quizzesCreated}</td>
            <td style="text-align:center;padding:12px 8px;color:${t.missionsCreated > 0 ? GREEN : SLATE};font-weight:${t.missionsCreated > 0 ? "700" : "400"};font-size:13px;">${t.missionsCreated}</td>
            <td style="text-align:center;padding:12px 8px;">
              <span style="background:${scoreBg(t.avgQuizScore)};color:${scoreColor(t.avgQuizScore)};font-weight:700;font-size:12px;padding:3px 8px;border-radius:20px;">
                ${t.avgQuizScore !== null ? `${t.avgQuizScore}%` : "—"}
              </span>
            </td>
          </tr>`;
    }).join("")}
        </table>
      </td>
    </tr>`;

    // Conclusiones automáticas
    const conclusions: string[] = [];
    if (adoptionRate < 50) conclusions.push(`⚠️ La adopción de ${adoptionRate}% está por debajo del umbral recomendado (50%). Se recomienda reforzar la difusión del acceso a QuestIA entre los alumnos.`);
    if (avgQuizScore !== null && avgQuizScore < 50) conclusions.push(`❌ El promedio de rendimiento en quizzes (${avgQuizScore}%) es bajo. Considere revisar la dificultad del contenido o reforzar con material de apoyo.`);
    if (atRiskCount > totalEnrolled * 0.2 && atRiskCount > 0) conclusions.push(`🚨 El ${Math.round(atRiskCount / totalEnrolled * 100)}% de los alumnos está en riesgo. Se recomienda intervención directa del equipo de apoyo estudiantil.`);
    const inactiveTeachers = teachersSummary.filter(t => t.quizzesCreated === 0 && t.missionsCreated === 0);
    if (inactiveTeachers.length > 0) conclusions.push(`📋 ${inactiveTeachers.length} docente(s) no han creado contenido este mes: ${inactiveTeachers.map(t => t.name).join(", ")}.`);
    if (adoptionRate >= 80 && (avgQuizScore ?? 0) >= 70) conclusions.push("✅ Excelente desempeño general. La carrera muestra alta adopción y rendimiento académico sobre el umbral esperado.");

    const conclusionSection = conclusions.length === 0 ? "" : `
    <tr>
      <td style="background:${WHITE};padding:24px 32px;">
        <p style="color:${SLATE};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">💡 Conclusiones Automáticas</p>
        ${conclusions.map(c => `<p style="color:#1e1b4b;font-size:13px;margin:0 0 10px;padding:10px 14px;background:${BG};border-radius:8px;line-height:1.5;">${c}</p>`).join("")}
      </td>
    </tr>`;

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#e8e4f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#e8e4f5;">
<tr><td align="center" style="padding:24px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.15);">
  ${emailHeader("Informe Mensual de Carrera", `Jefatura de Carrera · ${careerName}`, month)}
  ${kpis}
  <tr><td style="background:#f8f7ff;height:1px;"></td></tr>
  ${courseRanking}
  ${teacherSection}
  ${conclusionSection}
  ${emailFooter()}
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Mutation: Reporte Semanal (Coordinador) ─────────────────────────────────

export const sendWeeklyCoordinatorReports = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

        const careers = await ctx.db.query("careers").collect();
        if (careers.length === 0) return { sent: 0 };

        const allCourses = await ctx.db.query("courses").collect();

        let sent = 0;
        for (const career of careers) {
            const careerCourses = allCourses.filter(c => c.career_id === career._id);
            if (careerCourses.length === 0) continue;

            let totalWhitelisted = 0;
            let totalEnrolled = 0;
            let totalQuizScore = 0;
            let totalQuizSubs = 0;
            const atRiskMap = new Map<string, AtRiskStudent>();
            const coursesData: CourseStats[] = [];

            for (const course of careerCourses) {
                // Teacher name
                const teacher = await ctx.db.get(course.teacher_id);
                const teacherName = teacher?.name ?? "Docente";

                // Whitelist
                const wl = await ctx.db.query("whitelists")
                    .withIndex("by_course", q => q.eq("course_id", course._id))
                    .collect();
                totalWhitelisted += wl.length;

                // Enrollments
                const enrollments = await ctx.db.query("enrollments")
                    .withIndex("by_course", q => q.eq("course_id", course._id))
                    .collect();
                const uniqueStudentIds = new Set(enrollments.map(e => e.user_id));
                totalEnrolled += uniqueStudentIds.size;

                // Quiz submissions
                const quizzes = await ctx.db.query("quizzes")
                    .withIndex("by_course", q => q.eq("course_id", course._id))
                    .collect();
                let courseQuizScore = 0;
                let courseQuizSubs = 0;
                for (const quiz of quizzes) {
                    const subs = await ctx.db.query("quiz_submissions")
                        .withIndex("by_quiz", q => q.eq("quiz_id", quiz._id))
                        .collect();
                    for (const s of subs) {
                        courseQuizScore += s.score;
                        courseQuizSubs++;
                    }
                }
                totalQuizScore += courseQuizScore;
                totalQuizSubs += courseQuizSubs;

                // Missions (manual + quiz submissions combinados)
                const missions = await ctx.db.query("missions")
                    .withIndex("by_course", q => q.eq("course_id", course._id))
                    .collect();
                let missionsDone = 0;
                for (const m of missions) {
                    const subs = await ctx.db.query("mission_submissions")
                        .withIndex("by_mission", q => q.eq("mission_id", m._id))
                        .collect();
                    missionsDone += subs.length;
                }
                // Sumar quiz submissions como interacciones de desafío
                for (const quiz of quizzes) {
                    const qsubs = await ctx.db.query("quiz_submissions")
                        .withIndex("by_quiz", q => q.eq("quiz_id", quiz._id))
                        .collect();
                    missionsDone += qsubs.length;
                }

                // Upcoming evaluaciones (next 7 days)
                const evals = await ctx.db.query("evaluaciones")
                    .withIndex("by_course", q => q.eq("course_id", course._id))
                    .collect();
                const upcoming = evals.filter(e =>
                    e.activo && e.fecha > now && e.fecha <= now + sevenDaysMs
                );

                // At-risk students from this course
                for (const uid of uniqueStudentIds) {
                    if (atRiskMap.has(uid.toString())) continue;
                    const student = await ctx.db.get(uid);
                    if (!student) continue;
                    const lastAct = student.last_daily_bonus_at ?? 0;
                    const days = Math.floor((now - lastAct) / (24 * 60 * 60 * 1000));
                    if (days >= 7) {
                        atRiskMap.set(uid.toString(), {
                            name: student.name ?? "Alumno",
                            email: student.email ?? "",
                            days,
                        });
                    }
                }

                coursesData.push({
                    name: course.name,
                    code: course.code,
                    teacherName,
                    enrolled: uniqueStudentIds.size,
                    whitelisted: wl.length,
                    quizAvg: courseQuizSubs > 0 ? Math.round(courseQuizScore / courseQuizSubs) : null,
                    quizzesCount: quizzes.length,
                    quizSubmissionsCount: courseQuizSubs,
                    missionsCount: missions.length,
                    missionsDoneCount: missionsDone,
                    upcomingEvalsCount: upcoming.length,
                    upcomingEvals: upcoming.map(e => ({ titulo: e.titulo, tipo: e.tipo, fecha: e.fecha })),
                });
            }

            const periodStr = `Semana del ${new Date(weekAgo).toLocaleDateString("es-CL")} al ${new Date(now).toLocaleDateString("es-CL")}`;
            const data: CoordinatorReportData = {
                careerName: career.name,
                period: periodStr,
                totalWhitelisted,
                totalEnrolled,
                adoptionRate: totalWhitelisted > 0 ? Math.round((totalEnrolled / totalWhitelisted) * 100) : 0,
                avgQuizScore: totalQuizSubs > 0 ? Math.round(totalQuizScore / totalQuizSubs) : null,
                atRiskStudents: Array.from(atRiskMap.values()).sort((a, b) => b.days - a.days),
                coursesData,
            };

            const html = buildCoordinatorHtml(data);

            if (career.coordinator_email) {
                await ctx.scheduler.runAfter(0, internal.email.sendEmail, {
                    to: career.coordinator_email,
                    subject: `📊 Reporte Semanal QuestIA — ${career.name}`,
                    html,
                });
                sent++;
            }
        }

        return { sent };
    },
});

// ─── Mutation: Reporte Mensual (Jefe de Carrera / Director) ──────────────────

export const sendMonthlyDirectorReports = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const monthName = new Date(now).toLocaleDateString("es-CL", { month: "long", year: "numeric" });

        const careers = await ctx.db.query("careers").collect();
        if (careers.length === 0) return { sent: 0 };

        const allCourses = await ctx.db.query("courses").collect();

        let sent = 0;
        for (const career of careers) {
            const careerCourses = allCourses.filter(c => c.career_id === career._id);
            if (careerCourses.length === 0) continue;

            let totalWhitelisted = 0;
            let totalEnrolled = 0;
            let totalQuizScore = 0;
            let totalQuizSubs = 0;
            let totalMissionsDone = 0;
            const atRiskSet = new Set<string>();
            const coursesData: CourseStats[] = [];
            const teacherMap = new Map<string, TeacherSummary>();

            for (const course of careerCourses) {
                const teacher = await ctx.db.get(course.teacher_id);
                const teacherName = teacher?.name ?? "Docente";
                const teacherId = course.teacher_id.toString();

                // Teacher summary entry
                if (!teacherMap.has(teacherId)) {
                    teacherMap.set(teacherId, {
                        name: teacherName,
                        email: teacher?.email ?? "",
                        coursesCount: 0,
                        quizzesCreated: 0,
                        missionsCreated: 0,
                        avgQuizScore: null,
                    });
                }
                const teacherEntry = teacherMap.get(teacherId)!;
                teacherEntry.coursesCount++;

                // Whitelist
                const wl = await ctx.db.query("whitelists")
                    .withIndex("by_course", q => q.eq("course_id", course._id))
                    .collect();
                totalWhitelisted += wl.length;

                // Enrollments
                const enrollments = await ctx.db.query("enrollments")
                    .withIndex("by_course", q => q.eq("course_id", course._id))
                    .collect();
                const uniqueStudentIds = new Set(enrollments.map(e => e.user_id));
                totalEnrolled += uniqueStudentIds.size;

                // Quizzes (created in last 30 days counts toward teacher activity)
                const quizzes = await ctx.db.query("quizzes")
                    .withIndex("by_course", q => q.eq("course_id", course._id))
                    .collect();
                teacherEntry.quizzesCreated += quizzes.length;

                let courseQuizScore = 0;
                let courseQuizSubs = 0;
                for (const quiz of quizzes) {
                    const subs = await ctx.db.query("quiz_submissions")
                        .withIndex("by_quiz", q => q.eq("quiz_id", quiz._id))
                        .collect();
                    for (const s of subs) {
                        courseQuizScore += s.score;
                        courseQuizSubs++;
                    }
                }
                totalQuizScore += courseQuizScore;
                totalQuizSubs += courseQuizSubs;
                if (courseQuizSubs > 0) {
                    const avg = Math.round(courseQuizScore / courseQuizSubs);
                    teacherEntry.avgQuizScore = teacherEntry.avgQuizScore === null
                        ? avg
                        : Math.round((teacherEntry.avgQuizScore + avg) / 2);
                }

                // Missions (manual + quiz submissions combinados)
                const missions = await ctx.db.query("missions")
                    .withIndex("by_course", q => q.eq("course_id", course._id))
                    .collect();
                teacherEntry.missionsCreated += missions.length;
                let courseMissionsDone = 0;
                for (const m of missions) {
                    const subs = await ctx.db.query("mission_submissions")
                        .withIndex("by_mission", q => q.eq("mission_id", m._id))
                        .collect();
                    courseMissionsDone += subs.length;
                }
                // Sumar quiz submissions como interacciones de desafío
                for (const quiz of quizzes) {
                    const qsubs = await ctx.db.query("quiz_submissions")
                        .withIndex("by_quiz", q => q.eq("quiz_id", quiz._id))
                        .collect();
                    courseMissionsDone += qsubs.length;
                }
                totalMissionsDone += courseMissionsDone;

                // Upcoming evals (next 7 days)
                const evals = await ctx.db.query("evaluaciones")
                    .withIndex("by_course", q => q.eq("course_id", course._id))
                    .collect();
                const upcoming = evals.filter(e =>
                    e.activo && e.fecha > now && e.fecha <= now + sevenDaysMs
                );

                // At-risk
                for (const uid of uniqueStudentIds) {
                    if (atRiskSet.has(uid.toString())) continue;
                    const student = await ctx.db.get(uid);
                    if (!student) continue;
                    const lastAct = student.last_daily_bonus_at ?? 0;
                    if (now - lastAct > sevenDaysMs) {
                        atRiskSet.add(uid.toString());
                    }
                }

                coursesData.push({
                    name: course.name,
                    code: course.code,
                    teacherName,
                    enrolled: uniqueStudentIds.size,
                    whitelisted: wl.length,
                    quizAvg: courseQuizSubs > 0 ? Math.round(courseQuizScore / courseQuizSubs) : null,
                    quizzesCount: quizzes.length,
                    quizSubmissionsCount: courseQuizSubs,
                    missionsCount: missions.length,
                    missionsDoneCount: courseMissionsDone,
                    upcomingEvalsCount: upcoming.length,
                    upcomingEvals: upcoming.map(e => ({ titulo: e.titulo, tipo: e.tipo, fecha: e.fecha })),
                });
            }

            const data: DirectorReportData = {
                careerName: career.name,
                month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                totalWhitelisted,
                totalEnrolled,
                adoptionRate: totalWhitelisted > 0 ? Math.round((totalEnrolled / totalWhitelisted) * 100) : 0,
                avgQuizScore: totalQuizSubs > 0 ? Math.round(totalQuizScore / totalQuizSubs) : null,
                atRiskCount: atRiskSet.size,
                totalQuizSubmissions: totalQuizSubs,
                totalMissionsDone,
                coursesData,
                teachersSummary: Array.from(teacherMap.values()),
            };

            const html = buildDirectorHtml(data);

            // Enviar al director/jefe de carrera
            if (career.director_email) {
                await ctx.scheduler.runAfter(0, internal.email.sendEmail, {
                    to: career.director_email,
                    subject: `📈 Informe Mensual QuestIA — ${career.name} · ${data.month}`,
                    html,
                });
                sent++;
            }

            // Si hay jefe admin diferente, también le enviamos
            if (career.jefe_admin_email && career.jefe_admin_email !== career.director_email) {
                await ctx.scheduler.runAfter(0, internal.email.sendEmail, {
                    to: career.jefe_admin_email,
                    subject: `📈 Informe Mensual QuestIA — ${career.name} · ${data.month}`,
                    html,
                });
                sent++;
            }
        }

        return { sent };
    },
});

// ─── Mutation: Reporte on-demand (para el botón en el dashboard) ──────────────

export const sendReportNow = internalMutation({
    args: {},
    handler: async (ctx) => {
        // Dispara ambos reportes inmediatamente
        await ctx.scheduler.runAfter(0, internal.reports.sendWeeklyCoordinatorReports, {});
        await ctx.scheduler.runAfter(500, internal.reports.sendMonthlyDirectorReports, {});
        return { triggered: true };
    },
});
