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
        
        console.log('Titulo Cursos AVA:', await page.title());
        console.log('URL Cursos AVA:', page.url());
        
        // Extraer tarjetas o elementos de cursos
        const courses = await page.evaluate(() => {
            const list = [];
            // Selectores comunes en Blackboard Ultra
            document.querySelectorAll('a[href*="/ultra/courses/"], div[class*="course-card"], div[class*="element-card"]').forEach(el => {
                const text = el.innerText.trim();
                const link = el.getAttribute('href') || (el.querySelector('a') ? el.querySelector('a').getAttribute('href') : '');
                if (text) {
                    list.push({ text: text.replace(/\\n+/g, ' | '), link });
                }
            });
            return list;
        });
        
        console.log('CURSOS ENCONTRADOS:', JSON.stringify(courses, null, 2));
        
        if (courses.length === 0) {
            console.log('--- HTML DE LA LISTA ---');
            const text = await page.innerText('body');
            console.log(text.substring(0, 3000));
        }

        await page.close();
        await browser.close();
    } catch (e) {
        console.error('ERROR:', e.message);
    }
})();
"""

sftp = client.open_sftp()
with sftp.file("/home/nico/duoc-sync/extract_courses.js", "w") as f:
    f.write(js_content)
sftp.close()

stdin, stdout, stderr = client.exec_command("node /home/nico/duoc-sync/extract_courses.js")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

client.close()
