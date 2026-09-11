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
        
        console.log('Navegando a https://campusvirtual.duoc.cl/ultra/course ...');
        await page.goto('https://campusvirtual.duoc.cl/ultra/course', { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(6000);
        
        // Hacer clic en '2026-1' si existe
        const term2026 = page.locator('text="2026-1"').first();
        if (await term2026.isVisible({ timeout: 2000 })) {
            console.log('Haciendo clic en 2026-1...');
            await term2026.click();
            await page.waitForTimeout(4000);
        }

        const items = await page.evaluate(() => {
            const results = [];
            // Buscar todos los enlaces que lleven a cursos
            document.querySelectorAll('a').forEach(a => {
                const href = a.href || '';
                const text = a.innerText.trim();
                if (href.includes('/ultra/courses/') || href.includes('course_id') || text.includes('PEI') || text.includes('Sección') || text.includes('SECCION')) {
                    results.push({ text: text.replace(/\\n+/g, ' | '), href });
                }
            });
            // O elementos con clase que contengan nombres de cursos
            document.querySelectorAll('div[class*="element-details"], h4, h3, [role="row"]').forEach(el => {
                const txt = el.innerText.trim();
                if (txt && (txt.includes('2026') || txt.includes('PEI') || txt.includes('DIBUJO') || txt.includes('Sección') || txt.includes('Docente'))) {
                    results.push({ text: txt.replace(/\\n+/g, ' | '), href: '' });
                }
            });
            return results;
        });
        
        console.log('ELEMENTOS DETECTADOS:', JSON.stringify(items, null, 2));

        await page.close();
        await browser.close();
    } catch (e) {
        console.error('ERROR:', e.message);
    }
})();
"""

sftp = client.open_sftp()
with sftp.file("/home/nico/duoc-sync/extract_2026.js", "w") as f:
    f.write(js_content)
sftp.close()

stdin, stdout, stderr = client.exec_command("node /home/nico/duoc-sync/extract_2026.js")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

client.close()
