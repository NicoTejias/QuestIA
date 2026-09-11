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
        const page = context.pages().find(p => p.url().includes('experienciavivo.duoc.cl/docentes'));
        
        if (!page) {
            console.log('No se encontro pagina de docentes abierta');
            process.exit(0);
        }
        
        console.log('URL:', page.url());
        console.log('Title:', await page.title());
        
        const links = await page.$$eval('a', as => as.map(a => ({ text: a.innerText.trim().replace(/\\n/g, ' '), href: a.href })).filter(l => l.text.length > 0));
        console.log('TOTAL LINKS:', links.length);
        links.forEach(l => {
            const t = l.text.toLowerCase();
            if (t.includes('ava') || t.includes('blackboard') || t.includes('asignatura') || t.includes('curso') || t.includes('docen') || t.includes('horario') || t.includes('portal') || t.includes('alumno') || t.includes('nota') || t.includes('libro')) {
                console.log(`- [${l.text}] -> ${l.href}`);
            }
        });

        await browser.close();
    } catch (e) {
        console.error('ERROR:', e.message);
    }
})();
"""

sftp = client.open_sftp()
with sftp.file("/home/nico/duoc-sync/explore.js", "w") as f:
    f.write(js_content)
sftp.close()

stdin, stdout, stderr = client.exec_command("node /home/nico/duoc-sync/explore.js")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

client.close()
