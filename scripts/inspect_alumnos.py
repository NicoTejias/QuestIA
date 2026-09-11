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
        
        await page.goto('https://calificaciones.duoc.cl/portal-calificacion', { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(3000);
        
        // Clic en el primer botón 'Calificar' o similar para ver alumnos
        const calificarBtns = page.locator('text="Calificar"');
        const count = await calificarBtns.count();
        console.log('Botones de Calificar encontrados:', count);
        
        if (count > 0) {
            console.log('Haciendo clic en primer calificar...');
            await calificarBtns.first().click();
            await page.waitForTimeout(5000);
            
            console.log('URL de calificación:', page.url());
            const text = await page.innerText('body');
            console.log('EXTRACTO DE ALUMNOS:');
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
with sftp.file("/home/nico/duoc-sync/inspect_alumnos.js", "w") as f:
    f.write(js_content)
sftp.close()

stdin, stdout, stderr = client.exec_command("node /home/nico/duoc-sync/inspect_alumnos.js")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

client.close()
