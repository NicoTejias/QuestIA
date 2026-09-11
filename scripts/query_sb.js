const SUPABASE_URL = "https://wzkwmiyzszegekpuqnaz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8SlWG-0qPUkcPMvg36hhEA_RFdk8zqb";

async function run() {
    const headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
    };

    console.log("--- PERFILES DOCENTES ---");
    const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,clerk_id,email,name,role&role=eq.teacher`, { headers });
    const profiles = await profRes.json();
    console.log("Perfiles:", profiles);

    console.log("\n--- CURSOS ACTUALES ---");
    const courseRes = await fetch(`${SUPABASE_URL}/rest/v1/courses?select=id,code,name,description,teacher_id`, { headers });
    const courses = await courseRes.json();
    console.log("Cursos totales:", courses.length);
    courses.forEach(c => console.log(`- [${c.code}] ${c.name} (id: ${c.id})`));
}

run();
