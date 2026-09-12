const SUPABASE_URL = "https://wzkwmiyzszegekpuqnaz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8SlWG-0qPUkcPMvg36hhEA_RFdk8zqb";

const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json"
};

async function checkAllDocs() {
    console.log("Consultando todos los documentos en Supabase...");
    const res = await fetch(`${SUPABASE_URL}/rest/v1/course_documents?select=id,course_id,file_name,file_type,master_doc_type,uploaded_at,courses(id,code,name,teacher_id)&limit=100`, { headers });
    const docs = await res.json();
    console.log("Total documentos en el sistema:", docs.length);
    for (const d of docs) {
        console.log(`- [${d.courses?.code || 'SIN_CURSO'}] ${d.file_name} (tipo: ${d.master_doc_type || 'normal'}) - Curso ID: ${d.course_id}`);
    }
}

checkAllDocs();
