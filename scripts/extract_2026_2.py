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
        await page.waitForTimeout(5000);
        
        // Seleccionar 2026-2
        const term2026_2 = page.locator('text="2026-2"').first();
        if (await term2026_2.isVisible({ timeout: 2000 })) {
            console.log('Haciendo clic en periodo 2026-2...');
            await term2026_2.click();
            await page.waitForTimeout(4000);
        }

        const items = await page.evaluate(() => {
            const results = [];
            // Recoger enlaces y elementos con texto
            document.querySelectorAll('a, div[class*="element-details"], div[class*="course-org-list"] div, [role="row"]').forEach(el => {
                const text = el.innerText.trim();
                const link = el.tagName === 'A' ? el.href : (el.querySelector('a') ? el.querySelector('a').href : '');
                if (text && text.length > 5 && !results.some(r => r.text === text)) {
                    results.push({ text: text.replace(/\\n+/g, ' | '), link });
                }
            });
            return results;
        });
        
        console.log('--- CURSOS Y ELEMENTOS EN 2026-2 ---');
        console.log(JSON.stringify(items.slice(0, 30), null, 2));

        await page.close();
        await browser.close();
    } catch (e) {
        console.error('ERROR:', e.message);
    }
})();
"""

sftp = client.open_sftp()
with sftp.file("/home/nico/duoc-sync/extract_2026_2.js", "w") as f:
    f.write(js_content)
sftp.close()

stdin, stdout, stderr = client.exec_command("node /home/nico/duoc-sync/extract_2026_2.js")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

client.close()
