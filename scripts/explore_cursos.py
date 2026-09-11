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
        
        console.log('Navegando a https://experienciavivo.duoc.cl/docentes/mis-cursos ...');
        await page.goto('https://experienciavivo.duoc.cl/docentes/mis-cursos', { waitUntil: 'networkidle', timeout: 45000 });
        
        console.log('Titulo:', await page.title());
        console.log('URL:', page.url());
        
        // Extraer texto o cards de asignaturas
        const bodyText = await page.innerText('body');
        console.log('--- EXTRACTO CONTENIDO ---');
        console.log(bodyText.substring(0, 2000));
        
        await page.close();
        await browser.close();
    } catch (e) {
        console.error('ERROR:', e.message);
    }
})();
"""

sftp = client.open_sftp()
with sftp.file("/home/nico/duoc-sync/explore_cursos.js", "w") as f:
    f.write(js_content)
sftp.close()

stdin, stdout, stderr = client.exec_command("node /home/nico/duoc-sync/explore_cursos.js")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

client.close()
