import paramiko

host = "192.168.0.202"
user = "nico"
password = "P5lento0"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=22, username=user, password=password, timeout=10)

js_content = """
const { chromium } = require('playwright');

(async () => {
    try {
        const browser = await chromium.connectOverCDP('http://localhost:9222');
        const context = browser.contexts()[0];
        const page = await context.newPage();
        
        console.log('Conectado. Obteniendo cursos directamente via API interna de Blackboard...');
        
        // Ejecutamos un fetch autenticado desde el contexto del navegador
        await page.goto('https://campusvirtual.duoc.cl/ultra/course', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        const apiData = await page.evaluate(async () => {
            // Endpoints de Blackboard Learn Ultra para cursos del usuario
            const urls = [
                '/learn/api/public/v1/users/me/courses',
                '/learn/api/v1/courses',
                '/ultra/api/v1/users/me/courses'
            ];
            
            for (const u of urls) {
                try {
                    const r = await fetch(u, { credentials: 'include' });
                    if (r.ok) {
                        const json = await r.json();
                        return { url: u, data: json };
                    }
                } catch(e) {}
            }
            
            // Alternativa: extraer todos los textos de cursos renderizados en el DOM
            const cards = Array.from(document.querySelectorAll('course-card, [class*="course-card"], [class*="element-details"]')).map(c => c.innerText);
            return { fallback: cards };
        });
        
        console.log('RESULTADO API / DOM:');
        console.log(JSON.stringify(apiData, null, 2));

        await page.close();
        await browser.close();
    } catch (e) {
        console.error('ERROR:', e.message);
    }
})();
"""

sftp = client.open_sftp()
with sftp.file("/home/nico/duoc-sync/fetch_api_courses.js", "w") as f:
    f.write(js_content)
sftp.close()

stdin, stdout, stderr = client.exec_command("node /home/nico/duoc-sync/fetch_api_courses.js")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

client.close()
