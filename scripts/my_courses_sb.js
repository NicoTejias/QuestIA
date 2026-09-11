const SUPABASE_URL = "https://wzkwmiyzszegekpuqnaz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8SlWG-0qPUkcPMvg36hhEA_RFdk8zqb";
const TEACHER_ID = "user_3BAuEJEUMRcSXZ7t1EM6pMkVLug"; // NICOLAS CAMILO TEJIAS LLANOS (ni.tejias@profesor.duoc.cl)

async function run() {
    const headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
    };

    console.log("Cursos asociados al docente:");
    const res = await fetch(`${SUPABASE_URL}/rest/v1/courses?select=*&teacher_id=eq.${TEACHER_ID}`, { headers });
    const courses = await res.json();
    console.log("Cursos de Nico:", courses);
}

run();
