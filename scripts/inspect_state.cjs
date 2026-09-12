const fs = require('fs');

async function main() {
  const url = 'https://wzkwmiyzszegekpuqnaz.supabase.co';
  const key = 'sb_publishable_8SlWG-0qPUkcPMvg36hhEA_RFdk8zqb';

  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  };

  const cRes = await fetch(`${url}/rest/v1/courses?select=id,name,code,semester`, { headers });
  const courses = await cRes.json();
  console.log('--- COURSES ---');
  console.log(courses);

  const dRes = await fetch(`${url}/rest/v1/course_documents?select=*`, { headers });
  const docs = await dRes.json();
  console.log('--- COURSE DOCUMENTS ---');
  console.log(Array.isArray(docs) ? docs.map(d => ({ id: d.id, course_id: d.course_id, title: d.title, file_name: d.file_name, type: d.document_type || d.type })) : docs);

  const clRes = await fetch(`${url}/rest/v1/clases_calendarizadas?select=id,course_id,fecha,titulo,section&limit=20`, { headers });
  const clases = await clRes.json();
  console.log('--- CLASES CALENDARIZADAS COUNT ---');
  console.log('Total clases:', clases.length);
  if (clases.length > 0) {
    console.log('Sample clases:', clases.slice(0, 5));
  }
}

main().catch(console.error);
