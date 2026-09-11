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
        
        await page.goto('https://campusvirtual.duoc.cl/ultra/course', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(4000);
        
        const details = await page.evaluate(() => {
            const list = [];
            document.querySelectorAll('div[class*="element-details"]').forEach(el => {
                const title = el.querySelector('[class*="course-title"], h4, h3, a');
                const id = el.querySelector('[class*="course-id"], span[class*="secondary"]');
                list.push({
                    text: el.innerText.replace(/\\n+/g, ' | '),
                    title: title ? title.innerText : null,
                    id: id ? id.innerText : null,
                    allLinks: Array.from(el.querySelectorAll('a')).map(a => ({ t: a.innerText, h: a.href }))
                });
            });
            return list;
        });
        
        console.log('TOTAL ELEMENT-DETAILS:', details.length);
        console.log(JSON.stringify(details, null, 2));

        await page.close();
        await browser.close();
    } catch (e) {
        console.error('ERROR:', e.message);
    }
})();
"""

sftp = client.open_sftp()
with sftp.file("/home/nico/duoc-sync/inspect_cards.js", "w") as f:
    f.write(js_content)
sftp.close()

stdin, stdout, stderr = client.exec_command("node /home/nico/duoc-sync/inspect_cards.js")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

client.close()
