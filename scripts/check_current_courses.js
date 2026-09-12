const SUPABASE_URL = "https://wzkwmiyzszegekpuqnaz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8SlWG-0qPUkcPMvg36hhEA_RFdk8zqb";
const TEACHER_CLERK_ID = "user_3BAuEJEUMRcSXZ7t1EM6pMkVLug";

const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json"
};

async function check() {
    console.log("Consultando cursos de Nico...");
    const cRes = await fetch(`${SUPABASE_URL}/rest/v1/courses?teacher_id=eq.${TEACHER_CLERK_ID}&select=id,code,name,semester,schedule_config`, { headers });
    const courses = await cRes.json();
    console.log("Cursos:", courses.length);
    for (const c of courses) {
        console.log(`- [${c.code}] ${c.name} | Semester: ${c.semester}`);
        console.log(`  Config:`, JSON.stringify(c.schedule_config));

        // Ver documentos asociados
        const dRes = await fetch(`${SUPABASE_URL}/rest/v1/course_documents?course_id=eq.${c.id}&select=id,file_name,master_doc_type,uploaded_at`, { headers });
        const docs = await dRes.json();
        console.log(`  Docs:`, docs);

        // Ver clases calendarizadas
        const clRes = await fetch(`${SUPABASE_URL}/rest/v1/clases_calendarizadas?course_id=eq.${c.id}&select=id,semana,sesion,fecha,titulo,section&order=fecha.asc&limit=3`, { headers });
        const clases = await clRes.json();
        console.log(`  Clases (primeras 3):`, clases);
    }
}

check();
