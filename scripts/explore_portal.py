import paramiko

host = "192.168.0.202"
user = "nico"
password = "P5lento0"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=22, username=user, password=password, timeout=10)

js_script = """
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages().find(p => p.url().includes('experienciavivo.duoc.cl/docentes'));
    
    if (!page) {
        console.log('No se encontro pagina de docentes abierta');
        process.exit(0);
    }
    
    console.log('URL:', page.url());
    console.log('Title:', await page.title());
    
    // Extraer enlaces relevantes a AVA, Blackboard, Asignaturas, etc.
    const links = await page.$$eval('a', as => as.map(a => ({ text: a.innerText.trim(), href: a.href })).filter(l => l.text.length > 0));
    console.log('ENLACES EN VIVO DOCENTES:');
    links.forEach(l => {
        if (l.text.toLowerCase().includes('ava') || l.text.toLowerCase().includes('blackboard') || l.text.toLowerCase().includes('asignatura') || l.text.toLowerCase().includes('curso') || l.text.toLowerCase().includes('docen') || l.text.toLowerCase().includes('horario')) {
            console.log(`- ${l.text} -> ${l.href}`);
        }
    });

    await browser.close();
})();
"""

stdin, stdout, stderr = client.exec_command(f"node -e {paramiko.util.lazy_format(repr(js_script))}")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

client.close()
