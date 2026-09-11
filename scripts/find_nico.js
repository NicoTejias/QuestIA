const SUPABASE_URL = "https://wzkwmiyzszegekpuqnaz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8SlWG-0qPUkcPMvg36hhEA_RFdk8zqb";

async function run() {
    const headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
    };

    console.log("Buscando a nico / tejias en profiles...");
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, { headers });
    const profiles = await res.json();
    const matches = profiles.filter(p => 
        (p.email && (p.email.includes("tejias") || p.email.includes("nico"))) ||
        (p.name && p.name.toLowerCase().includes("tejias"))
    );
    console.log("Coincidencias de perfil:", matches);
}

run();
